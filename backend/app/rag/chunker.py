from app.rag.cleaner import clean_text

def chunk_text(text: str, chunk_size: int = 250, chunk_overlap: int = 50) -> list:
    """Splits text into overlapping chunks of approx chunk_size words."""
    words = text.split()
    chunks = []
    if not words:
        return chunks
    
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - chunk_overlap
    return chunks

def process_document_to_chunks(pages_data: list, metadata_template: dict) -> list:
    all_chunks = []
    chunk_index = 0
    for page in pages_data:
        cleaned_text = clean_text(page["text"])
        text_chunks = chunk_text(cleaned_text)
        for chunk in text_chunks:
            chunk_data = {
                "chunk_index": chunk_index,
                "page_number": page["page_number"],
                "text": chunk,
                "metadata": metadata_template.copy()
            }
            chunk_data["metadata"]["page"] = page["page_number"]
            all_chunks.append(chunk_data)
            chunk_index += 1
    return all_chunks
