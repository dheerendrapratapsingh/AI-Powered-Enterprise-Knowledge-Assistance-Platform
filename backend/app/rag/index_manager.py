import faiss
import numpy as np
import json
import os
from app.config import settings

class IndexManager:
    def __init__(self, index_name="vitap"):
        self.index_name = index_name
        self.index_path = os.path.join(settings.FAISS_DIR, f"{index_name}.index")
        self.metadata_path = os.path.join(settings.FAISS_DIR, f"{index_name}_metadata.json")
        self.dimension = 384 # default for all-MiniLM-L6-v2
        self.index = None
        self.metadata = {}
        self._last_mtime = 0.0
        
        os.makedirs(settings.FAISS_DIR, exist_ok=True)
        self.load_index()

    def ensure_fresh(self):
        if os.path.exists(self.index_path):
            mtime = os.path.getmtime(self.index_path)
            if mtime > self._last_mtime:
                self.load_index()

    def load_index(self):
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
            self._last_mtime = os.path.getmtime(self.index_path)

            # Ensure index supports ID mapping (add_with_ids / remove_ids)
            if not isinstance(self.index, (faiss.IndexIDMap, faiss.IndexIDMap2)):
                base_idx = self.index
                n = base_idx.ntotal
                new_idx = faiss.IndexIDMap2(faiss.IndexFlatIP(self.dimension))
                if n > 0:
                    vecs = np.zeros((n, self.dimension), dtype='float32')
                    for i in range(n):
                        vecs[i] = base_idx.reconstruct(i)
                    ids = np.array([int(k) for k in self.metadata.keys()][:n], dtype='int64')
                    if len(ids) != n:
                        ids = np.arange(n, dtype='int64')
                    new_idx.add_with_ids(vecs, ids)
                self.index = new_idx
                self.save_index()
        else:
            # Using IndexIDMap2 to allow addition and deletion with explicit IDs
            base_index = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIDMap2(base_index)
            self.metadata = {} # dict mapping ID to metadata

    def save_index(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)
        if os.path.exists(self.index_path):
            self._last_mtime = os.path.getmtime(self.index_path)

    def add_chunks(self, chunks: list, embeddings: list):
        if not chunks or not embeddings:
            return
            
        embeddings_np = np.array(embeddings).astype('float32')
        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings_np)
        
        # Determine starting ID
        start_id = max(map(int, self.metadata.keys())) + 1 if self.metadata else 0
        ids = np.arange(start_id, start_id + len(chunks)).astype('int64')
        
        self.index.add_with_ids(embeddings_np, ids)
        
        for i, chunk in zip(ids, chunks):
            self.metadata[str(i)] = chunk
            
        self.save_index()
        
    def delete_document(self, document_id: str):
        ids_to_remove = []
        for i, chunk in self.metadata.items():
            if chunk.get("metadata", {}).get("document_id") == document_id:
                ids_to_remove.append(int(i))
                
        if not ids_to_remove:
            return
            
        self.index.remove_ids(np.array(ids_to_remove).astype('int64'))
        for i in ids_to_remove:
            del self.metadata[str(i)]
            
        self.save_index()
