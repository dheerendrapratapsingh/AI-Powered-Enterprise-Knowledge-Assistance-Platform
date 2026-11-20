from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import json
import uuid

from app.database.connection import get_db, SessionLocal
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageSource
from app.models.feedback import Feedback
from app.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    Source, 
    FeedbackRequest,
    ConversationOut,
    ConversationUpdate,
    MessageOut
)
from app.routers.auth import get_current_user
from app.rag.pipeline import answer_question, is_draft_email_intent, FALLBACK_MESSAGE
from app.rag.retriever import retrieve_relevant_chunks
from app.rag.prompt_builder import build_streaming_prompt
from app.rag.llm_client import stream_response_tokens, check_gemini_configured, check_ollama_health
from app.rag.cache import get_cached_response, set_cached_response
from app.rag.intent import classify_query_intent, QueryIntent, get_fast_conversational_response

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = []
    conversation = None
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        if conversation:
            # Load recent dialogue turns (up to 10 previous messages)
            prev_msgs = db.query(Message).filter(
                Message.conversation_id == conversation.id
            ).order_by(Message.created_at.asc()).limit(10).all()
            for pm in prev_msgs:
                history.append({"role": pm.role, "content": pm.content})

    if not conversation:
        conversation = Conversation(user_id=current_user.id, title=request.question[:50])
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_msg = Message(conversation_id=conversation.id, role="user", content=request.question)
    db.add(user_msg)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    # 1. Check Semantic Cache
    cached = get_cached_response(request.question, organization_id=current_user.organization_id)
    if cached:
        ai_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=cached["answer"],
            response_type=cached.get("response_type", "answer")
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
        
        sources_out = [
            Source(
                document_id=s.get("document_id", ""),
                document_name=s.get("document_name", "Unknown"),
                page=s.get("page")
            )
            for s in cached.get("sources", [])
        ]
        return ChatResponse(
            answer=ai_msg.content,
            response_type=ai_msg.response_type,
            sources=sources_out,
            conversation_id=conversation.id,
            message_id=ai_msg.id
        )

    rag_result = answer_question(request.question, current_user, conversation_history=history)
    
    ai_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=rag_result.get("answer", "Error generating response"),
        response_type=rag_result.get("response_type", "answer")
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    sources_out = []
    for s in rag_result.get("sources", []):
        src = MessageSource(
            message_id=ai_msg.id,
            document_id=s.get("document_id"),
            page_number=s.get("page")
        )
        db.add(src)
        sources_out.append(Source(
            document_id=s.get("document_id", ""),
            document_name=s.get("document_name", "Unknown"),
            page=s.get("page")
        ))
    db.commit()

    if rag_result.get("response_type") in ("answer", "greeting"):
        set_cached_response(
            request.question,
            ai_msg.content,
            rag_result.get("sources", []),
            response_type=rag_result.get("response_type"),
            organization_id=current_user.organization_id
        )
    
    return ChatResponse(
        answer=ai_msg.content,
        response_type=ai_msg.response_type,
        sources=sources_out,
        conversation_id=conversation.id,
        message_id=ai_msg.id
    )

@router.post("/chat/stream")
def chat_stream_endpoint(request: ChatRequest, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    user_role = current_user.role
    question = request.question
    conversation_id = request.conversation_id
    default_org_name = current_user.organization.name if (current_user and current_user.organization) else "VIT-AP University"

    def event_stream():
        db = SessionLocal()
        try:
            # Resolve user & organization cleanly in this session
            user_obj = db.query(User).filter(User.id == user_id).first()
            resolved_org_name = user_obj.organization.name if (user_obj and user_obj.organization) else default_org_name
            user_org_id = user_obj.organization_id if user_obj else current_user.organization_id

            # 1. Manage Conversation (Auto-heal if conversation_id is invalid or missing)
            conv = None
            if conversation_id:
                conv = db.query(Conversation).filter(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id
                ).first()

            if not conv:
                conv = Conversation(user_id=user_id, title=question[:50])
                db.add(conv)
                db.commit()
                db.refresh(conv)

            # Record user message & touch updated_at
            user_msg = Message(conversation_id=conv.id, role="user", content=question)
            db.add(user_msg)
            conv.updated_at = datetime.now(timezone.utc)
            db.commit()

            # 1. Check Semantic Cache
            cached = get_cached_response(question, organization_id=user_org_id)
            if cached:
                ai_message_id = str(uuid.uuid4())
                metadata_packet = {
                    "type": "metadata",
                    "conversation_id": conv.id,
                    "message_id": ai_message_id,
                    "sources": cached.get("sources", []),
                    "response_type": cached.get("response_type", "answer")
                }
                yield f"data: {json.dumps(metadata_packet)}\n\n"

                cached_answer = cached.get("answer", "")
                yield f"data: {json.dumps({'type': 'token', 'token': cached_answer})}\n\n"

                ai_msg = Message(
                    id=ai_message_id,
                    conversation_id=conv.id,
                    role="assistant",
                    content=cached_answer,
                    response_type=cached.get("response_type", "answer")
                )
                db.add(ai_msg)
                for s in cached.get("sources", []):
                    src = MessageSource(
                        message_id=ai_msg.id,
                        document_id=s.get("document_id") or None,
                        page_number=s.get("page")
                    )
                    db.add(src)
                db.commit()
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

            # Retrieve prior dialogue history
            history = []
            prev_msgs = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(Message.created_at.asc()).limit(10).all()
            for pm in prev_msgs:
                history.append({"role": pm.role, "content": pm.content})

            # 2. Intent Classification & Routing
            intent = classify_query_intent(question)
            ai_message_id = str(uuid.uuid4())

            # Path A: Greetings & General Conversation (Bypass FAISS & Grounding Fallback)
            if intent in (QueryIntent.GREETING, QueryIntent.GENERAL_CONVERSATION):
                metadata_packet = {
                    "type": "metadata",
                    "conversation_id": conv.id,
                    "message_id": ai_message_id,
                    "sources": [],
                    "response_type": "greeting"
                }
                yield f"data: {json.dumps(metadata_packet)}\n\n"

                fast_resp = get_fast_conversational_response(question, org_name=resolved_org_name)
                prompt = build_streaming_prompt(question, [], conversation_history=history, intent=intent, org_name=resolved_org_name)
                collected_tokens = []
                for token in stream_response_tokens(prompt, fast_text=fast_resp):
                    collected_tokens.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
                full_answer = "".join(collected_tokens)

                ai_msg = Message(
                    id=ai_message_id,
                    conversation_id=conv.id,
                    role="assistant",
                    content=full_answer,
                    response_type="greeting"
                )
                db.add(ai_msg)
                db.commit()

                if full_answer:
                    set_cached_response(
                        question,
                        full_answer,
                        [],
                        response_type="greeting",
                        organization_id=user_org_id
                    )

                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

            # Path B: Out of Scope Queries (Bypass FAISS)
            if intent == QueryIntent.OUT_OF_SCOPE:
                metadata_packet = {
                    "type": "metadata",
                    "conversation_id": conv.id,
                    "message_id": ai_message_id,
                    "sources": [],
                    "response_type": "out_of_scope"
                }
                yield f"data: {json.dumps(metadata_packet)}\n\n"

                fast_resp = get_fast_conversational_response(question, org_name=resolved_org_name)
                prompt = build_streaming_prompt(question, [], conversation_history=history, intent=intent, org_name=resolved_org_name)
                collected_tokens = []
                for token in stream_response_tokens(prompt, fast_text=fast_resp):
                    collected_tokens.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
                full_answer = "".join(collected_tokens)

                ai_msg = Message(
                    id=ai_message_id,
                    conversation_id=conv.id,
                    role="assistant",
                    content=full_answer,
                    response_type="out_of_scope"
                )
                db.add(ai_msg)
                db.commit()

                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

            # Path C: University Knowledge, Document Search & Staff Directory
            chunks = retrieve_relevant_chunks(question, organization_id=user_org_id)
            allowed_chunks = []
            for c in chunks:
                access = str(c.get("metadata", {}).get("access_level", "student")).lower()
                if user_role.lower() == "student" and access not in ["student", "all"]:
                    continue
                allowed_chunks.append(c)

            sources_list = []
            seen_docs = set()
            for c in allowed_chunks:
                doc_id = c.get("metadata", {}).get("document_id", "")
                doc_name = c.get("metadata", {}).get("document_name", "Unknown")
                source_url = c.get("metadata", {}).get("source_url", "")
                source_type = c.get("metadata", {}).get("source_type", "manual")
                page = c.get("metadata", {}).get("page")
                key = (doc_id, page)
                if key not in seen_docs:
                    seen_docs.add(key)
                    sources_list.append({
                        "document_id": doc_id,
                        "document_name": doc_name,
                        "source_url": source_url,
                        "source_type": source_type,
                        "page": page
                    })

            # Yield metadata packet with sources immediately
            metadata_packet = {
                "type": "metadata",
                "conversation_id": conv.id,
                "message_id": ai_message_id,
                "sources": sources_list,
                "response_type": "answer" if allowed_chunks else "insufficient_information"
            }
            yield f"data: {json.dumps(metadata_packet)}\n\n"

            if not allowed_chunks:
                if not is_draft_email_intent(question):
                    fallback_msg = f"The requested information is not available in the official {resolved_org_name} documents provided. Please contact your School Dean or Course Coordinator for official assistance and clarification."
                    yield f"data: {json.dumps({'type': 'token', 'token': fallback_msg})}\n\n"
                    full_answer = fallback_msg
                else:
                    prompt = build_streaming_prompt(question, [], conversation_history=history, intent=intent, org_name=resolved_org_name)
                    collected_tokens = []
                    for token in stream_response_tokens(prompt):
                        collected_tokens.append(token)
                        yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
                    full_answer = "".join(collected_tokens)
            else:
                prompt = build_streaming_prompt(question, allowed_chunks, conversation_history=history, intent=intent, org_name=resolved_org_name)
                
                # Resilient fallback if neither Gemini nor Ollama is configured
                fast_fallback = None
                if not check_gemini_configured() and not check_ollama_health():
                    excerpts = []
                    for idx, c in enumerate(allowed_chunks[:2], 1):
                        name = c.get("metadata", {}).get("document_name", f"Official {resolved_org_name} Document")
                        text_snip = c.get("text", "").strip()
                        excerpts.append(f"**[{idx}] From {name}:**\n{text_snip}")
                    
                    joined_excerpts = "\n\n".join(excerpts)
                    fast_fallback = (
                        f"*(Extractive Grounding Mode — verified directly from university knowledge base)*\n\n"
                        f"{joined_excerpts}\n\n"
                        f"---\n"
                        f"💡 *Note: To enable generative AI synthesis, add your `GEMINI_API_KEY` to `.env` or start Ollama (`ollama run qwen2.5:1.5b`).*"
                    )

                collected_tokens = []
                is_email = is_draft_email_intent(question)
                if not is_email and not fast_fallback:
                    header = f"**{resolved_org_name.split()[0]} Official Information:**\n\n"
                    collected_tokens.append(header)
                    yield f"data: {json.dumps({'type': 'token', 'token': header})}\n\n"

                for token in stream_response_tokens(prompt, fast_text=fast_fallback):
                    collected_tokens.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
                full_answer = "".join(collected_tokens)

                # Defensive cleanup: Strip stray email artifacts if the query was purely informational
                if not is_email:
                    if "Subject:" in full_answer:
                        full_answer = re.sub(r"Subject:.*?\n+", "", full_answer, flags=re.IGNORECASE)
                    if "Dear Student," in full_answer:
                        full_answer = re.sub(r"Dear\s+(Student|User)[^\n]*\n+", "", full_answer, flags=re.IGNORECASE)

            # 4. Save AI message to database
            ai_msg = Message(
                id=ai_message_id,
                conversation_id=conv.id,
                role="assistant",
                content=full_answer,
                response_type="answer" if allowed_chunks else "insufficient_information"
            )
            db.add(ai_msg)

            for s in sources_list:
                src = MessageSource(
                    message_id=ai_msg.id,
                    document_id=s.get("document_id") or None,
                    page_number=s.get("page")
                )
                db.add(src)
            db.commit()

            # 5. Populate cache for valid answers
            if allowed_chunks and full_answer and not full_answer.startswith("I couldn't find sufficient"):
                set_cached_response(
                    question,
                    full_answer,
                    sources_list,
                    response_type="answer",
                    organization_id=user_org_id
                )

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        finally:
            db.close()

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        return []
        
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    results = []
    for m in messages:
        srcs = []
        for s in m.sources:
            doc_name = s.document.name if s.document else "Document"
            src_url = s.document.source_url if (s.document and s.document.source_url) else None
            src_type = s.document.source_type if (s.document and s.document.source_type) else "manual"
            srcs.append(Source(
                document_id=s.document_id or "",
                document_name=doc_name,
                page=s.page_number,
                relevance_score=s.relevance_score,
                source_url=src_url,
                source_type=src_type
            ))
        results.append(MessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            response_type=m.response_type,
            created_at=m.created_at,
            sources=srcs
        ))
    return results

@router.patch("/conversations/{conversation_id}", response_model=ConversationOut)
def rename_conversation(conversation_id: str, payload: ConversationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        return []
    new_title = payload.title.strip()
    if new_title:
        conv.title = new_title[:100]
        conv.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(conv)
    return conv

@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        return []
    db.delete(conv)
    db.commit()
    return {"status": "success", "message": "Conversation deleted"}

@router.delete("/conversations")
def clear_all_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    count = len(convs)
    for c in convs:
        db.delete(c)
    db.commit()
    return {"status": "success", "message": f"Cleared {count} conversations"}

@router.post("/chat/feedback")
def submit_feedback(request: FeedbackRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(Message).filter(Message.id == request.message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    feedback = Feedback(
        message_id=request.message_id,
        user_id=current_user.id,
        rating=request.rating,
        feedback_type=request.feedback_type,
        comment=request.comment
    )
    db.add(feedback)
    db.commit()
    return {"status": "success", "message": "Feedback recorded"}
