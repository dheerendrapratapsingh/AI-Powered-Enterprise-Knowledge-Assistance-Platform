from sentence_transformers import SentenceTransformer
from app.config import settings

model = None
try:
    model = SentenceTransformer(settings.EMBEDDING_MODEL)
except Exception as e:
    print(f"Warning: Failed to load embedding model {settings.EMBEDDING_MODEL}: {e}")

def generate_embedding(text: str) -> list:
    if not model:
        raise RuntimeError("Embedding model is not loaded.")
    embedding = model.encode(text)
    return embedding.tolist()

def generate_embeddings_for_chunks(chunks: list) -> list:
    if not model:
        raise RuntimeError("Embedding model is not loaded.")
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts)
    return embeddings.tolist()
