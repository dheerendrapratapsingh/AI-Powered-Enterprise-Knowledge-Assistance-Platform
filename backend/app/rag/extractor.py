import os
import pdfplumber
import markdown
from bs4 import BeautifulSoup
import docx

def extract_text_from_pdf(file_path: str) -> list:
    """Returns a list of dicts with page text and page number."""
    pages_data = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                pages_data.append({"page_number": i + 1, "text": text})
    return pages_data

def extract_text_from_txt(file_path: str) -> list:
    with open(file_path, "r", encoding="utf-8") as f:
        return [{"page_number": 1, "text": f.read()}]

def extract_text_from_markdown(file_path: str) -> list:
    with open(file_path, "r", encoding="utf-8") as f:
        html = markdown.markdown(f.read())
        soup = BeautifulSoup(html, "html.parser")
        return [{"page_number": 1, "text": soup.get_text()}]

def extract_text_from_docx(file_path: str) -> list:
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text)
    return [{"page_number": 1, "text": "\n".join(full_text)}]

def extract_text(file_path: str) -> list:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext == ".md":
        return extract_text_from_markdown(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
