import threading
from app.config import settings

_model = None
_model_lock = threading.Lock()

def get_embedding_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model

def generate_embedding(text: str) -> list:
    model = get_embedding_model()
    embedding = model.encode(text)
    return embedding.tolist()

def generate_embeddings_for_chunks(chunks: list) -> list:
    model = get_embedding_model()
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts)
    return embeddings.tolist()
