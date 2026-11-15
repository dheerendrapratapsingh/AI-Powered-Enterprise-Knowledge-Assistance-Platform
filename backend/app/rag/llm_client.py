import os
import json
import logging
import requests
from typing import Generator
from app.config import settings

logger = logging.getLogger(__name__)

def check_gemini_configured() -> bool:
    return bool(getattr(settings, "GEMINI_API_KEY", "").strip())

def check_ollama_health() -> bool:
    try:
        response = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2)
        return response.status_code == 200
    except requests.RequestException:
        return False

def _stream_gemini_tokens(prompt: str) -> Generator[str, None, None]:
    api_key = settings.GEMINI_API_KEY.strip()
    model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }
    with requests.post(url, headers=headers, json=payload, stream=True, timeout=40) as resp:
        if resp.status_code != 200:
            raise RuntimeError(f"Gemini API returned status {resp.status_code}: {resp.text}")
        for line in resp.iter_lines():
            if not line:
                continue
            line_str = line.decode("utf-8")
            if line_str.startswith("data: "):
                data_json = line_str[6:]
                try:
                    data = json.loads(data_json)
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for p in parts:
                            text = p.get("text", "")
                            if text:
                                yield text
                except Exception:
                    continue

def _stream_ollama_tokens(prompt: str) -> Generator[str, None, None]:
    if not check_ollama_health():
        raise RuntimeError("Local Ollama service is unavailable and no GEMINI_API_KEY is configured.")

    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {
            "num_predict": 300,
            "num_thread": 8,
            "temperature": 0.2
        }
    }
    response = requests.post(f"{settings.OLLAMA_BASE_URL}/api/generate", json=payload, stream=True, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"Ollama generation failed: {response.text}")
    for line in response.iter_lines():
        if line:
            chunk = json.loads(line.decode("utf-8"))
            yield chunk.get("response", "")
            if chunk.get("done", False):
                break

def stream_response_tokens(prompt: str, fast_text: str = None) -> Generator[str, None, None]:
    """
    Streams tokens prioritizing Google Gemini 2.0 Flash (fast, cloud, zero GPU).
    Seamlessly falls back to fast conversational streaming or local Ollama if Gemini key is absent.
    """
    if check_gemini_configured():
        try:
            yield from _stream_gemini_tokens(prompt)
            return
        except Exception as e:
            logger.warning(f"Google Gemini streaming failed ({e}), attempting Ollama fallback...")

    # Fast-path for simple conversational / greeting queries when offline
    if fast_text:
        import time
        words = fast_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            time.sleep(0.015)
        return

    yield from _stream_ollama_tokens(prompt)

def generate_response(prompt: str) -> dict:
    """
    Generates a structured JSON response prioritizing Gemini 2.0 Flash with Ollama fallback.
    """
    if check_gemini_configured():
        try:
            api_key = settings.GEMINI_API_KEY.strip()
            model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            resp = requests.post(url, json=payload, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                try:
                    return json.loads(text)
                except Exception:
                    return {"answer": text, "response_type": "answer", "sources": []}
        except Exception as e:
            logger.warning(f"Google Gemini JSON generation failed ({e}), falling back to Ollama...")

    # Fallback to Ollama
    if not check_ollama_health():
        raise RuntimeError("AI service unavailable: neither Google Gemini nor local Ollama is active.")

    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "num_predict": 300,
            "num_thread": 8,
            "temperature": 0.2
        }
    }
    response = requests.post(f"{settings.OLLAMA_BASE_URL}/api/generate", json=payload, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"Ollama generation failed: {response.text}")
    result_text = response.json().get("response", "{}")
    try:
        return json.loads(result_text)
    except Exception:
        return {"answer": result_text, "response_type": "answer", "sources": []}

