def build_prompt(question: str, context_chunks: list, conversation_history: list = None) -> str:
    context_text = "\n\n".join([
        f"Source: {c.get('metadata', {}).get('document_name', 'Unknown')} | Category: {c.get('metadata', {}).get('category', 'General')}\n{c.get('text', '')}" 
        for c in context_chunks
    ])
    
    history_section = ""
    if conversation_history:
        formatted = []
        for msg in conversation_history[-4:]:
            role = "Student" if msg.get("role") == "user" else "Assistant"
            formatted.append(f"{role}: {msg.get('content')}")
        if formatted:
            history_section = "\nRecent Conversation History:\n" + "\n".join(formatted) + "\n"

    prompt = f"""You are the VIT-AP Student AI Copilot.
Your job is to answer student questions using the provided VIT-AP knowledge context.

Rules:
1. Strict Program & Category Precision:
   - Identify the exact degree or branch asked (e.g., 'B.Tech CSE Core', 'B.Tech CSBS', 'B.Com', 'BBA', 'Dual Degree in Arts').
   - Only use information from the corresponding document. Never mix courses from different branches.
   - Distinguish clearly between 'Programme Core', 'University Core', and 'Programme Electives'.
   - If asked for courses with a specific subject code prefix (e.g. 'CSE', 'MGT', 'MAT'), list only courses matching that prefix.
2. Faculty & Directory Information:
   - If asked about faculty cabin numbers, employee numbers, titles, or departments, report the exact details from the directory context.
3. Ground Truth Authority:
   - The provided Context takes 100% precedence over previous conversation history. Disregard any contradictory past messages.
4. Code-Title Accuracy:
   - Strictly report exact course codes paired with their exact titles and credits as printed in the Context.
5. Presentation:
   - For course lists: list each course on its own bullet line:
     - **CODE**: Course Title (Credits)
6. You must respond in valid JSON format matching the schema provided.

Context:
{context_text}
{history_section}
Student Question:
{question}

Return ONLY a valid JSON object with the following structure:
{{
  "answer": "Your formatted answer here with clean markdown...",
  "response_type": "answer",
  "sources": [
    {{
      "document_id": "...",
      "document_name": "...",
      "page": 1
    }}
  ]
}}
"""
    return prompt

def build_streaming_prompt(question: str, context_chunks: list, conversation_history: list = None) -> str:
    context_text = "\n\n".join([
        f"Source: {c.get('metadata', {}).get('document_name', 'Unknown')} | Category: {c.get('metadata', {}).get('category', 'General')}\n{c.get('text', '')}" 
        for c in context_chunks
    ])
    
    history_section = ""
    if conversation_history:
        formatted = []
        for msg in conversation_history[-4:]:
            role = "Student" if msg.get("role") == "user" else "Assistant"
            formatted.append(f"{role}: {msg.get('content')}")
        if formatted:
            history_section = "\nRecent Conversation History:\n" + "\n".join(formatted) + "\n"

    prompt = f"""You are the VIT-AP Student AI Copilot.
Answer the student's question based strictly on the provided VIT-AP policy context below.

Rules:
1. Strict Program & Category Precision:
   - Pay close attention to the specific degree/branch asked (e.g., 'B.Tech CSE Core', 'B.Tech CSBS', 'B.Com', 'BBA', 'Dual Degree in Arts').
   - Only report courses belonging to the requested degree and category (Programme Core, University Core, or Electives).
   - If asked for courses with a specific code prefix (e.g., 'CSE', 'MGT', 'MAT', 'HUM', 'LAW'), only list courses matching that prefix.
2. Faculty & Directory Inquiries:
   - If asked about a faculty member (e.g., cabin number, employee ID, title, or department), provide the exact information directly and concisely.
3. Code-Title Accuracy:
   - Strictly report exact course codes with their printed titles and credits. Never invent or swap codes.
4. Ground Truth Authority:
   - The provided Context takes 100% precedence over previous conversation history. Disregard any incorrect prior messages.
5. Presentation:
   - For course lists: list each course on its own bullet line:
     - **CODE**: Course Title (Credits)
6. Reply in natural, helpful, formatted Markdown. Do NOT output raw JSON.

Context:
{context_text}
{history_section}
Student Question:
{question}

Assistant:"""
    return prompt
