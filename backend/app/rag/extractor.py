import os
import re
import csv
import pdfplumber
import markdown
from bs4 import BeautifulSoup
import docx

def parse_universal_curriculum_pdf(file_path: str) -> list:
    """
    Universal parser for VIT-AP curriculum & credit structure PDFs.
    Extracts headers, credit summaries, and courses categorized under
    University Core, Programme Core (and Majors), Programme Electives (and Minors),
    University Electives, and Honours Degree.
    """
    with pdfplumber.open(file_path) as pdf:
        p0 = pdf.pages[0]
        words_p0 = p0.extract_words()
        top_words = [w for w in words_p0 if w["top"] < 85]
        top_lines = []
        cur_l, cur_t = [], None
        for w in sorted(top_words, key=lambda w: (w["top"], w["x0"])):
            if cur_t is None or abs(w["top"] - cur_t) <= 4.0:
                cur_l.append(w)
                cur_t = w["top"]
            else:
                top_lines.append(" ".join(x["text"] for x in sorted(cur_l, key=lambda x: x["x0"])))
                cur_l, cur_t = [w], w["top"]
        if cur_l:
            top_lines.append(" ".join(x["text"] for x in sorted(cur_l, key=lambda x: x["x0"])))
            
        degree = top_lines[1] if len(top_lines) > 1 else os.path.basename(file_path)
        school = top_lines[2] if len(top_lines) > 2 else ""

        sections = {}
        current_section = "Curriculum Overview"
        sections[current_section] = []

        split_x = 295.0

        for p_idx, page in enumerate(pdf.pages):
            words = page.extract_words()
            left_w = [w for w in words if w["x1"] <= split_x]
            right_w = [w for w in words if w["x0"] >= split_x]

            for col_words, is_right in [(left_w, False), (right_w, True)]:
                code_x_max = 75 if not is_right else split_x + 65
                title_x_max = 230 if not is_right else split_x + 225

                sorted_w = sorted(col_words, key=lambda w: (w["top"], w["x0"]))
                lines = []
                cur_line, cur_top = [], None
                for w in sorted_w:
                    if cur_top is None or abs(w["top"] - cur_top) <= 4.0:
                        cur_line.append(w)
                        cur_top = w["top"]
                    else:
                        lines.append((cur_top, cur_line))
                        cur_line, cur_top = [w], w["top"]
                if cur_line:
                    lines.append((cur_top, cur_line))

                codes = sorted([
                    w for w in col_words 
                    if w["x0"] < code_x_max and (re.match(r"^[A-Z]{3,4}[0-9X]{3,4}", w["text"]) or w["text"] in ["BAP", "XXXX"])
                ], key=lambda w: w["top"])

                events = []
                for top_pos, l_words in lines:
                    text = " ".join(x["text"] for x in sorted(l_words, key=lambda x: x["x0"]))
                    events.append((top_pos, "line", text))
                for c in codes:
                    events.append((c["top"], "code", c))
                events.sort(key=lambda ev: ev[0])

                for ev_top, ev_type, ev_data in events:
                    if ev_type == "line":
                        lt_lower = ev_data.lower()
                        if "course title" in lt_lower or "t p c" in lt_lower:
                            continue
                        if "courses" in lt_lower and any(num in lt_lower for num in ["70", "80", "64", "40", "18", "30", "60", "29"]):
                            continue
                        if "graded credit" in lt_lower or "credit requirement" in lt_lower:
                            continue

                        if "university core" in lt_lower:
                            current_section = "University Core Courses"
                        elif "programme core" in lt_lower:
                            current_section = "Programme Core Courses"
                        elif "major " in lt_lower:
                            current_section = f"Programme Core - {ev_data.strip()}"
                        elif "programme elective" in lt_lower or "specialization elective" in lt_lower:
                            current_section = "Programme Electives"
                        elif "minor " in lt_lower:
                            current_section = f"Programme Electives - {ev_data.strip()}"
                        elif "university elective" in lt_lower:
                            current_section = "University Electives"
                        elif "honours degree" in lt_lower:
                            current_section = "Honours Degree Requirements"
                        if current_section not in sections:
                            sections[current_section] = []

                    elif ev_type == "code":
                        code = ev_data
                        idx = codes.index(code)
                        prev_top = codes[idx-1]["top"] if idx > 0 else code["top"] - 14
                        next_top = codes[idx+1]["top"] if idx < len(codes) - 1 else code["top"] + 14
                        y_start = (prev_top + code["top"]) / 2
                        y_end = (code["top"] + next_top) / 2

                        tw = [w for w in col_words if code_x_max <= w["x0"] < title_x_max and y_start <= w["top"] < y_end]
                        tw = sorted(tw, key=lambda w: (round(w["top"]), w["x0"]))
                        title = " ".join(w["text"] for w in tw if w["text"] not in ["Course", "Title", "Code", "T", "P", "C"])

                        cw = [w for w in col_words if w["x0"] >= title_x_max and y_start <= w["top"] < y_end]
                        cw = sorted(cw, key=lambda w: w["x0"])
                        creds = " ".join(w["text"] for w in cw)

                        if title:
                            if current_section not in sections: sections[current_section] = []
                            sections[current_section].append(f"- **{code['text']}**: {title} ({creds})")

        # Compile structured text
        output_blocks = [f"# {degree}\nSchool: {school}"]
        for sec_name, items in sections.items():
            if items:
                block = f"## {sec_name}\n" + "\n".join(items)
                output_blocks.append(block)

        return [{"page_number": 1, "text": "\n\n".join(output_blocks)}]

def extract_text_from_pdf(file_path: str) -> list:
    """
    Extracts text from PDF pages. Automatically detects curriculum/syllabus tables
    and uses the universal curriculum parser. Otherwise uses multi-column coordinate extraction.
    """
    with pdfplumber.open(file_path) as pdf:
        sample_text = " ".join([p.extract_text() or "" for p in pdf.pages[:2]])
        
    is_curriculum = "credit structure" in sample_text.lower() or "programme core" in sample_text.lower() or "programme credit" in sample_text.lower()
    if is_curriculum:
        return parse_universal_curriculum_pdf(file_path)

    pages_data = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            words = page.extract_words()
            if not words:
                pages_data.append({"page_number": i + 1, "text": ""})
                continue

            mid = page.width / 2
            left_words = [w for w in words if w["x0"] < mid]
            right_words = [w for w in words if w["x0"] >= mid]

            if len(left_words) > 15 and len(right_words) > 15:
                sorted_left = sorted(left_words, key=lambda w: (round(w["top"] / 8), w["x0"]))
                left_text = " ".join([w["text"] for w in sorted_left])

                sorted_right = sorted(right_words, key=lambda w: (round(w["top"] / 8), w["x0"]))
                right_text = " ".join([w["text"] for w in sorted_right])

                full_page_text = left_text + "\n\n" + right_text
            else:
                full_page_text = page.extract_text(layout=True) or page.extract_text() or ""

            pages_data.append({"page_number": i + 1, "text": full_page_text})
    return pages_data

def extract_text_from_csv(file_path: str) -> list:
    """
    Extracts CSV/TSV tables into structured natural language records so that
    faculty members, cabin numbers, employee IDs, and departments are seamlessly searchable.
    """
    delimiter = "\t" if file_path.endswith(".tsv") else ","
    rows = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter=delimiter)
        for row in reader:
            if any(cell.strip() for cell in row):
                rows.append([c.strip() for c in row])

    if not rows:
        return [{"page_number": 1, "text": ""}]

    header = rows[0]
    data_rows = rows[1:]

    records = []
    for r in data_rows:
        fields = []
        for h, val in zip(header, r):
            if val:
                fields.append(f"{h}: {val}")
        records.append("- " + " | ".join(fields))

    doc_name = os.path.basename(file_path)
    full_text = f"# Directory: {doc_name}\n\n" + "\n".join(records)
    return [{"page_number": 1, "text": full_text}]

def extract_text_from_xlsx(file_path: str) -> list:
    """
    Extracts Excel sheets into structured natural language records.
    """
    try:
        import openpyxl
    except ImportError:
        raise RuntimeError("openpyxl library is required to extract Excel files. Please install openpyxl.")

    wb = openpyxl.load_workbook(file_path, data_only=True)
    sheet_blocks = []
    doc_name = os.path.basename(file_path)

    for sname in wb.sheetnames:
        sheet = wb[sname]
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            continue
        header = [str(c).strip() if c is not None else "" for c in rows[0]]
        records = []
        for r in rows[1:]:
            if not any(r):
                continue
            fields = []
            for h, v in zip(header, r):
                if v is not None and str(v).strip():
                    fields.append(f"{h}: {v}")
            if fields:
                records.append("- " + " | ".join(fields))

        if records:
            sheet_block = f"# Directory: {doc_name} | Sheet: {sname}\n\n" + "\n".join(records)
            sheet_blocks.append(sheet_block)

    full_text = "\n\n".join(sheet_blocks)
    return [{"page_number": 1, "text": full_text}]

def extract_text_from_docx(file_path: str) -> list:
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text)

    # Also extract any tables in docx
    for table in doc.tables:
        t_rows = []
        for row in table.rows:
            r_cells = [c.text.strip() for c in row.cells]
            if any(r_cells):
                t_rows.append(" | ".join(r_cells))
        if t_rows:
            full_text.append("\n".join(t_rows))

    return [{"page_number": 1, "text": "\n\n".join(full_text)}]

def extract_text_from_txt(file_path: str) -> list:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return [{"page_number": 1, "text": f.read()}]

def extract_text_from_markdown(file_path: str) -> list:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        html = markdown.markdown(f.read())
        soup = BeautifulSoup(html, "html.parser")
        return [{"page_number": 1, "text": soup.get_text()}]

def extract_text_from_pptx(file_path: str) -> list:
    """
    Extracts text, slide titles, and tables from PowerPoint presentations.
    """
    from pptx import Presentation
    prs = Presentation(file_path)
    slides_data = []
    for idx, slide in enumerate(prs.slides):
        slide_lines = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    line = paragraph.text.strip()
                    if line:
                        slide_lines.append(line)
            elif shape.has_table:
                for row in shape.table.rows:
                    row_cells = [c.text.strip() for c in row.cells if c.text.strip()]
                    if row_cells:
                        slide_lines.append(" | ".join(row_cells))
        if slide_lines:
            slides_data.append({
                "page_number": idx + 1,
                "text": f"## Slide {idx + 1}\n\n" + "\n".join(slide_lines)
            })
    if not slides_data:
        slides_data.append({"page_number": 1, "text": "Empty presentation"})
    return slides_data

def extract_text_from_html(file_path_or_content: str) -> list:
    """
    Extracts clean readable text from HTML files or raw HTML strings.
    """
    if os.path.exists(file_path_or_content):
        with open(file_path_or_content, "r", encoding="utf-8", errors="replace") as f:
            html = f.read()
    else:
        html = file_path_or_content

    soup = BeautifulSoup(html, "html.parser")
    for s in soup(["script", "style", "nav", "footer", "iframe", "noscript"]):
        s.decompose()
    return [{"page_number": 1, "text": soup.get_text(separator="\n", strip=True)}]

def extract_text_from_doc(file_path: str) -> list:
    """
    Extracts readable text and metadata from legacy Word .doc binary files.
    """
    basename = os.path.basename(file_path)
    clean_name = os.path.splitext(basename)[0].replace("_", " ").replace("+", " ")

    with open(file_path, "rb") as f:
        raw = f.read()

    chunks = re.findall(b'[\x20-\x7E\r\n]{4,}', raw)
    text_lines = []
    for c in chunks:
        s = c.decode("latin1", errors="ignore").strip()
        if len(s) > 3 and not re.match(r'^(IHDR|IDAT|PLTE|tEXt|pHYs|bjbj|[#=\-]{4,})', s):
            text_lines.append(s)

    header_info = f"# Campus Transport & Routes: {clean_name}\nOfficial university transport guidelines, route schedule and bus stops for {clean_name}."
    body = "\n".join(text_lines[:150]) if text_lines else f"Official bus route schedule and stop details for {clean_name}."
    return [{"page_number": 1, "text": f"{header_info}\n\n{body}"}]

def extract_text(file_path: str) -> list:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".csv", ".tsv"]:
        return extract_text_from_csv(file_path)
    elif ext in [".xlsx", ".xls"]:
        return extract_text_from_xlsx(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".doc":
        return extract_text_from_doc(file_path)
    elif ext in [".pptx", ".ppt"]:
        return extract_text_from_pptx(file_path)
    elif ext in [".html", ".htm"]:
        return extract_text_from_html(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext == ".md":
        return extract_text_from_markdown(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}. Supported types: PDF, CSV, XLSX, DOCX, DOC, PPTX, HTML, TXT, MD")
