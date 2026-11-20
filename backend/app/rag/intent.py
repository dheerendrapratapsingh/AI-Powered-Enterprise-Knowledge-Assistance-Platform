import re
from enum import Enum

class QueryIntent(str, Enum):
    GREETING = "GREETING"
    GENERAL_CONVERSATION = "GENERAL_CONVERSATION"
    UNIVERSITY_KNOWLEDGE = "UNIVERSITY_KNOWLEDGE"
    DOCUMENT_SEARCH = "DOCUMENT_SEARCH"
    STAFF_DIRECTORY = "STAFF_DIRECTORY"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


# Common simple greetings (when query is solely or predominantly a greeting)
GREETING_PATTERNS = [
    r"^(hi|hello|hey|hiya|howdy|heya|hola|namaste|greetings)\b",
    r"^good\s+(morning|afternoon|evening|day|night)\b",
    r"^(hi|hello|hey)\s+(there|copilot|assistant|bot|vitap|vit\s*ap)\b",
    r"^(hey|hello)\s*$"
]

# General conversational queries: capabilities, identity, status, thanks, farewells
CONVERSATION_PATTERNS = [
    # Identity & capabilities
    r"who\s+(are\s+you|created\s+you|made\s+you)",
    r"what\s+(are\s+you|is\s+your\s+name|can\s+you\s+do|are\s+your\s+capabilities|are\s+your\s+features)",
    r"(introduce\s+yourself|tell\s+me\s+about\s+yourself|what\s+do\s+you\s+do|how\s+do\s+you\s+work)",
    r"^(help|can\s+you\s+help\s+me|i\s+need\s+help)(\s+please|\s+copilot|\s*)?$",
    r"what\s+can\s+i\s+(ask|do)\b",
    
    # Courtesy & well-being
    r"how\s+are\s+you(\s+doing)?",
    r"how\s+is\s+it\s+going",
    r"how\'?s\s+everything",
    r"^(thank\s+you|thanks|thanks\s+a\s+lot|thank\s+you\s+so\s+much|thx|much\s+appreciated|appreciate\s+it)\b",
    
    # Farewells
    r"^(bye|goodbye|see\s+you|see\s+ya|talk\s+to\s+you\s+later|have\s+a\s+good\s+day|cya)\b",
    
    # Small talk affirmations
    r"^(ok|okay|great|awesome|cool|nice|understood|got\s+it)\b"
]

# University staff & faculty directory cues
STAFF_DIRECTORY_KEYWORDS = [
    "cabin", "faculty", "professor", "prof.", "prof ", "dr.", "dr ", "doctor",
    "dean", "school dean", "hod", "head of department", "coordinator", "programme coordinator",
    "program coordinator", "course coordinator", "employee id", "employee number",
    "designation", "contact directory", "staff directory", "warden", "chief warden",
    "director", "contact of", "contact number", "contact details", "contact", "registrar",
    "chancellor", "vice chancellor", "office of", "email of", "phone of"
]

# Explicit university domain keywords (if present, takes precedence over general chat)
UNIVERSITY_DOMAIN_KEYWORDS = [
    "vit-ap", "vitap", "vit ap", "vtop", "b.tech", "btech", "m.tech", "mtech",
    "bba", "b.com", "bcom", "cse", "csbs", "ece", "mech",
    "curriculum", "curricula", "syllabus", "syllabi", "programme core", "program core",
    "university core", "elective", "specialization", "course code", "course", "courses",
    "credit", "credits", "graded credit", "cgpa", "gpa", "grade", "grading",
    "attendance", "75%", "debar", "ffcs", "registration",
    "hostel", "hostels", "outing", "outings", "general leave", "night attendance",
    "curfew", "biometric", "mess", "leave application", "proctor", "mentor",
    "exam", "examination", "mid-term", "fat", "cat", "arrear", "re-registration",
    "draft an email", "draft email", "compose email", "write email", "email template",
    "scholarship", "fee", "fees", "academic regulation", "bylaw", "rule", "rules"
]

# Explicit out-of-scope non-university topics
OUT_OF_SCOPE_PATTERNS = [
    r"unrelated\s+to\s+vit",
    r"not\s+related\s+to\s+(vit|university|college|campus)",
    r"\b(write|generate|give\s+me)\s+(a\s+)?(python|javascript|java|c\+\+|sql|php|ruby|rust)\s+(script|code|program|function)\b",
    r"\b(quicksort|mergesort|binary\s+search|leetcode|hackerrank|sort\s+a\s+binary)\b",
    r"\b(who\s+won|score\s+of|cricket\s+match|football\s+match|fifa|ipl|world\s+cup)\b",
    r"\b(capital\s+of|president\s+of|prime\s+minister\s+of|population\s+of)\b",
    r"\b(tell\s+me\s+a\s+joke|make\s+me\s+laugh|write\s+a\s+poem|recipe\s+for|how\s+to\s+cook)\b",
    r"\b(weather\s+in|stock\s+price|cryptocurrency|bitcoin)\b",
    r"\b(recommend\s+a\s+movie|best\s+song|actor\s+in)\b",
    r"\b(quantum\s+physics|string\s+theory|quantum\s+mechanics|general\s+relativity|black\s+hole)\b",
    r"\b(photosynthesis|cellular\s+respiration|dna\s+replication|darwin|evolution)\b",
    r"\b(world\s+war|french\s+revolution|ancient\s+rome|napoleon)\b"
]


def get_clean_org_names(org_name: str):
    if not org_name:
        return "VIT-AP University", "VIT-AP AI Copilot", "VIT-AP"
    lower = org_name.lower()
    if "srm" in lower:
        return "SRM University AP", "SRM AP AI Copilot", "SRM AP"
    if "vit" in lower:
        return "VIT-AP University", "VIT-AP AI Copilot", "VIT-AP"
    short = org_name.split()[0]
    return org_name, f"{short} AI Copilot", short

def get_fast_conversational_response(query: str, org_name: str = "VIT-AP University") -> str | None:
    """
    Returns an instant, high-quality response for common greetings, identity,
    and courtesy queries customized to the user's institution.
    """
    full_org, copilot_name, short_org = get_clean_org_names(org_name)
    clean = query.strip().lower()
    clean = re.sub(r"^[^\w]+|[^\w]+$", "", clean)

    # Simple greetings
    if re.search(r"^(hi|hello|hey|hiya|howdy|namaste|greetings)(\s+(there|copilot|assistant|bot|vitap|srm|srmap))?$", clean):
        return f"Hello! Welcome to {copilot_name}. How can I help you today? You can ask me about academic regulations, degree curricula, hostel rules, or university staff."
    if re.search(r"^good\s+(morning|day)", clean):
        return f"Good morning! Welcome to {copilot_name}. How can I assist you with your academics or campus life today?"
    if re.search(r"^good\s+afternoon", clean):
        return f"Good afternoon! Welcome to {copilot_name}. How can I help you today?"
    if re.search(r"^good\s+evening", clean):
        return f"Good evening! Welcome to {copilot_name}. Feel free to ask any questions about {short_org} regulations, courses, or hostels."

    # Identity & capabilities
    if re.search(r"^(who\s+are\s+you|what\s+are\s+you)$", clean):
        return f"I am the **{copilot_name}**, an intelligent campus assistant designed to help students, faculty, and administration with official {full_org} knowledge, academic bylaws, hostel regulations, and campus directories."
    if re.search(r"^(what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|how\s+can\s+you\s+help|what\s+do\s+you\s+do)$", clean):
        return (
            f"I can help you explore official {short_org} university information, including:\n\n"
            f"- **Academic Regulations & Curricula**: Degree requirements, course credit limits, and grading policies.\n"
            f"- **Hostel Guidelines**: Campus outing timings, leave policies, and curfew rules.\n"
            f"- **Campus Directory**: Locating faculty cabins, employee numbers, and departmental designations.\n"
            f"- **Official Correspondence**: Formatting formal inquiries addressed to Department Heads and Deans."
        )

    # Thanks & courtesy
    if re.search(r"^(thank\s+you|thanks|thanks\s+a\s+lot|thank\s+you\s+so\s+much|thx)$", clean):
        return f"You're very welcome! Feel free to ask if you have any more questions about {short_org}. Have a productive day!"
    if re.search(r"^how\s+are\s+you(\s+doing)?$", clean):
        return f"I'm doing well and ready to assist you! How can I help you with your {short_org} academic or campus questions today?"
    if re.search(r"^(bye|goodbye|see\s+you|have\s+a\s+good\s+day)$", clean):
        return f"Goodbye! Have a great and productive day ahead at {short_org}!"

    return None


def classify_query_intent(query: str) -> QueryIntent:
    """
    Deterministically classifies query intent with zero latency.
    Ensures greetings and general conversation bypass document retrieval,
    while university questions are properly grounded.
    """
    clean_q = query.strip().lower()
    # Strip basic outer punctuation: "hello?!" -> "hello"
    clean_q = re.sub(r"^[^\w]+|[^\w]+$", "", clean_q)

    if not clean_q:
        return QueryIntent.GREETING

    # 1. Check for explicit out-of-scope patterns first
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, clean_q, re.IGNORECASE):
            return QueryIntent.OUT_OF_SCOPE

    # 2. Check if query contains strong university keywords
    # If the user says: "Hello, what are the B.Tech CSE core courses?",
    # the university inquiry MUST take precedence over the greeting!
    has_university_keyword = any(k in clean_q for k in UNIVERSITY_DOMAIN_KEYWORDS)
    has_staff_keyword = any(k in clean_q for k in STAFF_DIRECTORY_KEYWORDS)

    if has_staff_keyword:
        return QueryIntent.STAFF_DIRECTORY

    if has_university_keyword:
        if any(clean_q.startswith(w) for w in ["search", "find document", "lookup", "show document", "browse"]):
            return QueryIntent.DOCUMENT_SEARCH
        return QueryIntent.UNIVERSITY_KNOWLEDGE

    # 3. Check for pure Greetings
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, clean_q, re.IGNORECASE):
            # Check length: if query has substantial extra words, it might be a question
            word_count = len(clean_q.split())
            if word_count <= 4:
                return QueryIntent.GREETING

    # 4. Check for General Conversation (identity, capabilities, small talk, thanks)
    for pattern in CONVERSATION_PATTERNS:
        if re.search(pattern, clean_q, re.IGNORECASE):
            return QueryIntent.GENERAL_CONVERSATION

    # 5. Check for document search verbs
    if clean_q.startswith(("search", "find", "lookup", "where can i find")) and any(
        w in clean_q for w in ["rule", "policy", "syllabus", "doc", "pdf", "file", "guide"]
    ):
        return QueryIntent.DOCUMENT_SEARCH

    # 6. Check general out of scope cues:
    # If a query is asking for general facts with words like "capital of", "code", "movie", etc.
    general_non_campus = [
        "president", "prime minister", "capital", "movie", "song", "recipe",
        "bitcoin", "crypto", "weather", "horoscope", "sports"
    ]
    if any(k in clean_q for k in general_non_campus) and not has_university_keyword:
        return QueryIntent.OUT_OF_SCOPE

    # 7. Default to UNIVERSITY_KNOWLEDGE so FAISS checks relevance against documents
    return QueryIntent.UNIVERSITY_KNOWLEDGE


def is_draft_email_intent(question: str) -> bool:
    q_lower = question.lower().strip()
    
    # Exclude questions, complaints, or negative expressions about emails
    negative_patterns = [
        "why", "what i want", "don't want", "dont want", "did not ask", "didn't ask", 
        "no email", "stop writing", "not an email", "why did you", "what did you", "who told you"
    ]
    if any(neg in q_lower for neg in negative_patterns):
        return False
        
    imperative_patterns = [
        r"\b(draft|compose|write|generate|prepare|send)\s+(a\s+|an\s+)?(formal\s+)?(email|mail)\b",
        r"\b(email|mail)\s+(template|draft)\b",
        r"^(draft|compose|write)\s+(an?\s+)?email"
    ]
    return any(re.search(pat, q_lower) for pat in imperative_patterns)

