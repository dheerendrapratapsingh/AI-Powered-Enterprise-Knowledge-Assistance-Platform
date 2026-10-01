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
        self.metadata = []
        
        os.makedirs(settings.FAISS_DIR, exist_ok=True)
        self.load_index()

    def load_index(self):
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
        else:
            # Using IndexIDMap to allow deletion later if needed
            base_index = faiss.IndexFlatIP(self.dimension) # Inner product for cosine similarity usually
            self.index = faiss.IndexIDMap(base_index)
            self.metadata = {} # dict mapping ID to metadata

    def save_index(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)

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
