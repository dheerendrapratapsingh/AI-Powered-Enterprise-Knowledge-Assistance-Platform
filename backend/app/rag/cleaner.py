import re

def clean_text(text: str) -> str:
    # Remove multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text)
    # Remove special invisible characters
    text = re.sub(r'[\u200b\u200c\u200d\u200e\u200f\ufeff]', '', text)
    return text.strip()
