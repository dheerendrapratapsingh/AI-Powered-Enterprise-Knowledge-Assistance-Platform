from app.rag.embedder import generate_embedding
from app.rag.index_manager import IndexManager
from app.config import settings
import numpy as np
import faiss

index_manager = IndexManager()

def retrieve_relevant_chunks(question: str, top_k: int = None) -> list:
    if top_k is None:
        top_k = settings.TOP_K
        
    query_embedding = generate_embedding(question)
    query_np = np.array([query_embedding]).astype('float32')
    faiss.normalize_L2(query_np)
    
    distances, indices = index_manager.index.search(query_np, top_k)
    
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        
        # We used IndexFlatIP with normalized vectors, so dist is cosine similarity.
        if dist >= settings.SIMILARITY_THRESHOLD:
            chunk_data = index_manager.metadata.get(str(idx))
            if chunk_data:
                chunk_data["score"] = float(dist)
                results.append(chunk_data)
                
    return results
