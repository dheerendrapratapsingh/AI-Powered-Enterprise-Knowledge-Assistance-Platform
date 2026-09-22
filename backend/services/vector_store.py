import os
import json
from typing import List, Dict, Any, Tuple
import numpy as np

# Optional FAISS and SentenceTransformer imports with graceful mock fallback for test environments
try:
    import faiss
    from sentence_transformers import SentenceTransformer
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

from config import settings

class VectorStoreManager:
    _embedding_model = None

    @classmethod
    def get_embedding_model(cls):
        if cls._embedding_model is None and FAISS_AVAILABLE:
            cls._embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        return cls._embedding_model

    @staticmethod
    def get_tenant_index_path(org_id: str) -> str:
        os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
        return os.path.join(settings.VECTOR_STORE_DIR, f"org_{org_id}.faiss")

    @staticmethod
    def get_tenant_metadata_path(org_id: str) -> str:
        os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
        return os.path.join(settings.VECTOR_STORE_DIR, f"org_{org_id}_meta.json")

    @classmethod
    def add_chunks(cls, org_id: str, chunks: List[Dict[str, Any]]):
        """
        Embeds chunks and adds them to the tenant-specific FAISS index.
        """
        if not chunks:
            return

        texts = [c["content"] for c in chunks]
        meta_path = cls.get_tenant_metadata_path(org_id)
        index_path = cls.get_tenant_index_path(org_id)

        # Load or init metadata map
        existing_meta = []
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                existing_meta = json.load(f)

        if FAISS_AVAILABLE:
            model = cls.get_embedding_model()
            embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            dimension = embeddings.shape[1]

            if os.path.exists(index_path):
                index = faiss.read_index(index_path)
            else:
                index = faiss.IndexFlatIP(dimension)  # Cosine similarity for normalized vectors

            index.add(embeddings.astype("float32"))
            faiss.write_index(index, index_path)
        
        # Save metadata
        for c in chunks:
            existing_meta.append({
                "chunk_id": c.get("id"),
                "document_id": c.get("document_id"),
                "doc_title": c.get("doc_title", "Document"),
                "page_number": c.get("page_number", 1),
                "content": c.get("content", ""),
            })

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(existing_meta, f, indent=2)

    @classmethod
    def search(cls, org_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves top-k matching chunks for an org using vector search.
        """
        meta_path = cls.get_tenant_metadata_path(org_id)
        index_path = cls.get_tenant_index_path(org_id)

        if not os.path.exists(meta_path):
            return []

        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        if not metadata:
            return []

        if FAISS_AVAILABLE and os.path.exists(index_path):
            model = cls.get_embedding_model()
            query_embedding = model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
            index = faiss.read_index(index_path)
            
            k = min(top_k, index.ntotal)
            if k == 0:
                return []

            distances, indices = index.search(query_embedding.astype("float32"), k)
            
            results = []
            for score, idx in zip(distances[0], indices[0]):
                if idx < len(metadata):
                    item = metadata[idx].copy()
                    item["similarity_score"] = float(score)
                    results.append(item)
            return results
        else:
            # Fallback simple keyword match if FAISS not present
            words = set(query.lower().split())
            scored = []
            for item in metadata:
                content_words = set(item.get("content", "").lower().split())
                overlap = len(words.intersection(content_words))
                score = overlap / max(1, len(words))
                scored.append((score, item))
            
            scored.sort(key=lambda x: x[0], reverse=True)
            return [
                {**item, "similarity_score": max(0.5, score)}
                for score, item in scored[:top_k]
            ]
