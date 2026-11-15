import re

def clean_text(text: str) -> str:
    """
    Cleans text by normalizing whitespace while carefully preserving newlines,
    markdown headers, and list formatting.
    """
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse multiple horizontal spaces or tabs on a single line into a single space
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse excessive blank lines (3 or more into 2)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove special invisible unicode characters and non-printable control characters (excluding \n and \t)
    text = re.sub(r"[\u200b\u200c\u200d\u200e\u200f\ufeff]", "", text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text.strip()
