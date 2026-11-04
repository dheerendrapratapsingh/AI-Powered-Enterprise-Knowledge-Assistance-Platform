from app.rag.cleaner import clean_text

def chunk_text(text: str, max_words_per_chunk: int = 250) -> list:
    """
    Chunks text by markdown sections (## or #). If a section has more than
    max_words_per_chunk words (e.g. large course lists or faculty directory rows),
    sub-chunks it while preserving the section header on each chunk.
    """
    if "## " in text or (text.startswith("# ") and "\n- " in text):
        raw_sections = text.split("\n## ")
        chunks = []
        doc_header = ""
        
        for idx, sec in enumerate(raw_sections):
            if idx == 0 and sec.startswith("# "):
                lines = sec.split("\n", 1)
                doc_header = lines[0].strip() + "\n"
                if len(lines) > 1 and lines[1].strip():
                    sec_title = lines[0].strip() + "\n"
                    sec_content = lines[1].strip()
                else:
                    continue
            else:
                sec_lines = sec.split("\n", 1)
                sec_title = f"{doc_header}## {sec_lines[0].strip()}\n"
                sec_content = sec_lines[1].strip() if len(sec_lines) > 1 else ""

            words = sec_content.split()
            if len(words) <= max_words_per_chunk:
                chunks.append((sec_title + sec_content).strip())
            else:
                content_lines = sec_content.split("\n")
                sub_lines = []
                cur_word_count = 0
                part = 1
                for line in content_lines:
                    lw = len(line.split())
                    if cur_word_count + lw > max_words_per_chunk and sub_lines:
                        chunks.append(f"{sec_title.strip()} (Part {part})\n" + "\n".join(sub_lines))
                        sub_lines = [line]
                        cur_word_count = lw
                        part += 1
                    else:
                        sub_lines.append(line)
                        cur_word_count += lw
                if sub_lines:
                    chunks.append(f"{sec_title.strip()}" + (f" (Part {part})\n" if part > 1 else "\n") + "\n".join(sub_lines))
        if chunks:
            return chunks

    words = text.split()
    chunks = []
    if not words:
        return chunks
    
    i = 0
    chunk_overlap = 40
    while i < len(words):
        chunk = " ".join(words[i:i + max_words_per_chunk])
        chunks.append(chunk)
        i += max_words_per_chunk - chunk_overlap
    return chunks

def process_document_to_chunks(pages_data: list, metadata_template: dict) -> list:
    all_chunks = []
    chunk_index = 0
    for page in pages_data:
        cleaned_text = clean_text(page["text"])
        text_chunks = chunk_text(cleaned_text)
        for chunk in text_chunks:
            cat = metadata_template.get("category")
            for line in chunk.split("\n"):
                if line.startswith("## "):
                    cat = line.replace("## ", "").split("(")[0].strip()
                    break
                elif line.startswith("# ") and not cat:
                    cat = line.replace("# ", "").split("(")[0].strip()

            chunk_meta = metadata_template.copy()
            chunk_meta["page"] = page["page_number"]
            chunk_meta["category"] = cat

            chunk_data = {
                "chunk_index": chunk_index,
                "page_number": page["page_number"],
                "text": chunk,
                "metadata": chunk_meta
            }
            all_chunks.append(chunk_data)
            chunk_index += 1
    return all_chunks
