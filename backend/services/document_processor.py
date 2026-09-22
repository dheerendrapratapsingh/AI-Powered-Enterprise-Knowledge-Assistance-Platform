import os
import pypdf
from typing import List, Dict, Any

class DocumentProcessor:
    @staticmethod
    def extract_text(file_path: str, mime_type: str = "application/pdf") -> List[Dict[str, Any]]:
        """
        Extracts text from PDF, DOCX, or TXT file with page numbering.
        Returns a list of dicts: [{'page_number': 1, 'text': '...'}]
        """
        pages = []
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        if file_path.endswith(".pdf") or "pdf" in mime_type:
            with open(file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                for idx, page in enumerate(reader.pages):
                    extracted = page.extract_text() or ""
                    if extracted.strip():
                        pages.append({"page_number": idx + 1, "text": extracted.strip()})
        else:
            # Fallback for txt / markdown
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                pages.append({"page_number": 1, "text": content})

        return pages

    @staticmethod
    def chunk_text(pages: List[Dict[str, Any]], chunk_size_words: int = 200, overlap_words: int = 40) -> List[Dict[str, Any]]:
        """
        Splits text into chunks using sliding window with token/word overlap.
        """
        chunks = []
        chunk_idx = 0

        for p in pages:
            page_num = p["page_number"]
            words = p["text"].split()
            
            if not words:
                continue

            step = max(1, chunk_size_words - overlap_words)
            for i in range(0, len(words), step):
                chunk_words = words[i:i + chunk_size_words]
                chunk_text = " ".join(chunk_words)
                
                if len(chunk_text.strip()) > 20:
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "page_number": page_num,
                        "content": chunk_text,
                        "token_count": len(chunk_words)
                    })
                    chunk_idx += 1

        return chunks
