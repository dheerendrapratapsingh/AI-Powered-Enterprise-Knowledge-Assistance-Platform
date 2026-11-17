import re
from urllib.parse import urljoin, urlparse, urldefrag
from typing import Dict, List, Set, Tuple
from bs4 import BeautifulSoup
import trafilatura

DOCUMENT_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".xls", ".pptx", ".txt", ".csv"}

class ExtractedWebPage:
    def __init__(self):
        self.url = ""
        self.canonical_url = ""
        self.title = ""
        self.meta_description = ""
        self.headings: List[str] = []
        self.clean_markdown = ""
        self.raw_text = ""
        self.internal_links: Set[str] = set()
        self.document_links: Set[str] = set()

def normalize_url(url: str) -> str:
    """
    Strips fragments, trailing slashes, and lowercases scheme/host.
    """
    clean_url, _ = urldefrag(url)
    parsed = urlparse(clean_url)
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    path = parsed.path
    if path.endswith("/") and len(path) > 1:
        path = path[:-1]
    query = f"?{parsed.query}" if parsed.query else ""
    return f"{scheme}://{netloc}{path}{query}"

def extract_webpage_content(html: str, base_url: str) -> ExtractedWebPage:
    """
    Extracts structured content, headings, tables, clean text, and discovered links
    from raw HTML using a hybrid Trafilatura + BeautifulSoup pipeline.
    """
    result = ExtractedWebPage()
    result.url = normalize_url(base_url)

    soup = BeautifulSoup(html, "lxml")

    # 1. Canonical URL
    canon_tag = soup.find("link", rel=lambda val: val and "canonical" in val.lower())
    if canon_tag and canon_tag.get("href"):
        result.canonical_url = normalize_url(urljoin(base_url, canon_tag["href"]))
    else:
        result.canonical_url = result.url

    # 2. Page Title
    if soup.title and soup.title.string:
        result.title = soup.title.string.strip()
    elif soup.h1:
        result.title = soup.h1.get_text(strip=True)
    else:
        result.title = result.url

    # 3. Meta Description
    meta_desc = soup.find("meta", attrs={"name": lambda v: v and v.lower() == "description"})
    if meta_desc and meta_desc.get("content"):
        result.meta_description = meta_desc["content"].strip()

    # 4. Discover Links (Internal & Documents)
    base_domain = urlparse(base_url).netloc.lower()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue

        absolute_url = urljoin(base_url, href)
        norm_url = normalize_url(absolute_url)
        parsed_target = urlparse(norm_url)
        target_ext = "." + parsed_target.path.split(".")[-1].lower() if "." in parsed_target.path else ""

        if target_ext in DOCUMENT_EXTENSIONS:
            result.document_links.add(norm_url)
        elif parsed_target.netloc.lower() == base_domain or parsed_target.netloc.lower().endswith("." + base_domain):
            result.internal_links.add(norm_url)

    # Next.js RSC App Router Payload Link & Doc Discovery
    rsc_chunks = re.findall(r'self\.__next_f\.push\(\[1,\s*"(.*?)"\]\)', html, re.DOTALL)
    rsc_combined = ""
    if rsc_chunks:
        rsc_combined = "".join(rsc_chunks).replace('\\"', '"').replace('\\n', '\n')
        rsc_hrefs = re.findall(r'"href":\s*"([^"]+)"', rsc_combined)
        for href in rsc_hrefs:
            href = href.strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")) or href.startswith("/_next"):
                continue
            absolute_url = urljoin(base_url, href)
            norm_url = normalize_url(absolute_url)
            parsed_target = urlparse(norm_url)
            target_ext = "." + parsed_target.path.split(".")[-1].lower() if "." in parsed_target.path else ""

            if target_ext in DOCUMENT_EXTENSIONS:
                result.document_links.add(norm_url)
            elif parsed_target.netloc.lower() == base_domain or parsed_target.netloc.lower().endswith("." + base_domain):
                result.internal_links.add(norm_url)

    # 5. Extract Headings Hierarchy
    for h in soup.find_all(["h1", "h2", "h3"]):
        h_text = h.get_text(strip=True)
        if h_text and len(h_text) > 2:
            result.headings.append(f"{h.name.upper()}: {h_text}")

    # 6. Extract Main Content via Trafilatura (cleans boilerplate, navbars, footers, ads)
    extracted_text = trafilatura.extract(
        html,
        url=base_url,
        include_tables=True,
        include_links=False,
        output_format="txt",
        favor_precision=True
    )

    # Fallback to BeautifulSoup clean text if Trafilatura returns empty
    if not extracted_text or len(extracted_text.strip()) < 50:
        for unwanted in soup.find_all(["nav", "footer", "header", "script", "style", "noscript", "svg", "form"]):
            unwanted.decompose()
        
        main_content = soup.find("main") or soup.find("article") or soup.find("div", class_=re.compile(r"content|main|body", re.I)) or soup.body
        if main_content:
            extracted_text = main_content.get_text(separator="\n", strip=True)
        else:
            extracted_text = soup.get_text(separator="\n", strip=True)

        if len(extracted_text.strip()) < 50 and rsc_combined:
            text_matches = re.findall(r'"children":\s*"([^"]+)"', rsc_combined)
            if text_matches:
                extracted_text = "\n".join(text_matches)

    result.raw_text = extracted_text or ""

    # 7. Build Structured Markdown Document for RAG Ingestion
    doc_sections = [
        f"# {result.title}",
        f"**Source URL**: {result.url}",
    ]
    if result.meta_description:
        doc_sections.append(f"*{result.meta_description}*")

    if result.headings:
        doc_sections.append("### Page Outline:\n" + "\n".join(f"- {h}" for h in result.headings[:8]))

    doc_sections.append("## Content\n" + result.raw_text)

    result.clean_markdown = "\n\n".join(doc_sections)
    return result
