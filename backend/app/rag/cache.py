import re
import json
import logging
import numpy as np
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.config import settings
from app.database.connection import SessionLocal
from app.models.cache import ResponseCache
from app.rag.embedder import generate_embedding

logger = logging.getLogger(__name__)

def normalize_query(query: str) -> str:
    """Normalize query text for exact matching."""
    text = query.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def get_cached_response(query: str, organization_id: Optional[str] = None) -> Optional[dict]:
    """
    Looks up a question in the semantic response cache.
    1. Checks exact normalized string match.
    2. If no exact match, computes cosine similarity with cached queries (>= threshold).
    Returns None if cache missed or disabled.
    """
    if not getattr(settings, "ENABLE_SEMANTIC_CACHE", True):
        return None

    norm_query = normalize_query(query)
    if not norm_query:
        return None

    db: Session = SessionLocal()
    try:
        # 1. Exact match check
        query_filter = db.query(ResponseCache).filter(ResponseCache.normalized_query == norm_query)
        if organization_id:
            query_filter = query_filter.filter(
                (ResponseCache.organization_id == organization_id) | (ResponseCache.organization_id.is_(None))
            )
        exact_entry = query_filter.first()

        if exact_entry:
            exact_entry.hit_count = (exact_entry.hit_count or 0) + 1
            db.commit()
            return {
                "answer": exact_entry.answer,
                "response_type": exact_entry.response_type,
                "sources": json.loads(exact_entry.sources_json or "[]"),
                "cached": True,
                "match_type": "exact"
            }

        # 2. Semantic vector match check
        all_cached = db.query(ResponseCache).all()
        if not all_cached:
            return None

        query_emb = np.array(generate_embedding(query), dtype=np.float32)
        norm_q = np.linalg.norm(query_emb)
        if norm_q > 0:
            query_emb = query_emb / norm_q

        best_score = 0.0
        best_entry = None

        threshold = getattr(settings, "CACHE_SIMILARITY_THRESHOLD", 0.95)

        for entry in all_cached:
            if organization_id and entry.organization_id and entry.organization_id != organization_id:
                continue
            try:
                cached_vec = np.array(json.loads(entry.embedding_json), dtype=np.float32)
                norm_c = np.linalg.norm(cached_vec)
                if norm_c > 0:
                    cached_vec = cached_vec / norm_c
                similarity = float(np.dot(query_emb, cached_vec))
                if similarity > best_score:
                    best_score = similarity
                    best_entry = entry
            except Exception:
                continue

        if best_entry and best_score >= threshold:
            best_entry.hit_count = (best_entry.hit_count or 0) + 1
            db.commit()
            logger.info(f"Semantic cache hit ({best_score:.4f}) for: '{query}' -> matched: '{best_entry.query_text}'")
            return {
                "answer": best_entry.answer,
                "response_type": best_entry.response_type,
                "sources": json.loads(best_entry.sources_json or "[]"),
                "cached": True,
                "match_type": "semantic",
                "similarity": best_score
            }

        return None
    except Exception as e:
        logger.error(f"Error checking response cache: {e}")
        return None
    finally:
        db.close()

def set_cached_response(
    query: str, 
    answer: str, 
    sources: list, 
    response_type: str = "answer", 
    organization_id: Optional[str] = None
) -> None:
    """Stores verified answer and sources in the response cache."""
    if not getattr(settings, "ENABLE_SEMANTIC_CACHE", True):
        return

    # Do not cache insufficient info or errors
    if response_type == "insufficient_information" or not answer.strip():
        return

    norm_query = normalize_query(query)
    if not norm_query:
        return

    db: Session = SessionLocal()
    try:
        existing = db.query(ResponseCache).filter(ResponseCache.normalized_query == norm_query).first()
        if existing:
            existing.answer = answer
            existing.sources_json = json.dumps(sources)
            existing.response_type = response_type
            db.commit()
            return

        query_emb = generate_embedding(query)
        new_cache = ResponseCache(
            normalized_query=norm_query,
            query_text=query.strip(),
            embedding_json=json.dumps(query_emb),
            answer=answer,
            response_type=response_type,
            sources_json=json.dumps(sources),
            organization_id=organization_id,
            hit_count=1
        )
        db.add(new_cache)
        db.commit()
    except Exception as e:
        logger.error(f"Error setting response cache: {e}")
        db.rollback()
    finally:
        db.close()

