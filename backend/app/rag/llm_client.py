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
    model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash").replace("models/", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }
    with requests.post(url, headers=headers, json=payload, stream=True, timeout=25) as resp:
        if resp.status_code != 200:
            raise RuntimeError(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")
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
        notice = (
            "⚠️ **AI Generation Service Unavailable**\n\n"
            "Neither a **Google Gemini API Key** is configured nor is the local **Ollama** service running.\n\n"
            "### How to enable AI responses:\n"
            "1. **Google Gemini (Recommended — Ultra-fast, zero GPU):**\n"
            "   - Open `.env` in your project folder.\n"
            "   - Add your key: `GEMINI_API_KEY=AIzaSy...` ([Get free key at Google AI Studio](https://aistudio.google.com/app/apikey))\n"
            "   - Save the file and restart the backend server.\n\n"
            "2. **Local Ollama Fallback:**\n"
            "   - Run `ollama run qwen2.5:1.5b` in your terminal.\n"
        )
        import time
        for word in notice.split(" "):
            yield word + " "
            time.sleep(0.015)
        return

    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {
            "num_predict": 400,
            "num_thread": 8,
            "temperature": 0.2
        }
    }
    yielded_any = False
    try:
        # Connect timeout: 5s, Read timeout: 90s (allows Ollama sufficient time to evaluate context & generate)
        response = requests.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate", 
            json=payload, 
            stream=True, 
            timeout=(5.0, 90.0)
        )
        if response.status_code != 200:
            raise RuntimeError(f"Ollama generation failed: {response.text}")
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line.decode("utf-8"))
                token = chunk.get("response", "")
                if token:
                    yielded_any = True
                    yield token
                if chunk.get("done", False):
                    break
    except requests.exceptions.Timeout:
        if not yielded_any:
            yield "The local AI engine took longer than expected to process the response. Please try asking again."
    except Exception as e:
        if not yielded_any:
            yield f"Unable to generate response via local model: {str(e)}"

def stream_response_tokens(prompt: str, fast_text: str = None) -> Generator[str, None, None]:
    """
    Streams tokens prioritizing immediate fast-text typing for greetings/small talk (<30ms),
    and Google Gemini for deep university grounding.
    Seamlessly falls back to local Ollama if Gemini key is absent or failing.
    """
    # Fast-path for simple conversational / greeting queries (instant response)
    if fast_text:
        import time
        words = fast_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            time.sleep(0.015)
        return

    gemini_error = None
    if check_gemini_configured():
        try:
            yield from _stream_gemini_tokens(prompt)
            return
        except Exception as e:
            gemini_error = str(e)
            logger.warning(f"Google Gemini streaming failed ({e}), attempting Ollama fallback...")

    # If local Ollama is running and healthy, use it
    if check_ollama_health():
        yield from _stream_ollama_tokens(prompt)
        return

    # If neither cloud Gemini nor local Ollama is available
    if gemini_error:
        yield f"⚠️ **Google Gemini Connection Issue:** {gemini_error[:150]}. Please verify your `GEMINI_API_KEY` in deployment environment variables."
    else:
        yield from _stream_ollama_tokens(prompt)

def generate_response(prompt: str) -> dict:
    """
    Generates a structured JSON response prioritizing Gemini with Ollama fallback.
    """
    gemini_error = None
    if check_gemini_configured():
        try:
            api_key = settings.GEMINI_API_KEY.strip()
            model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash").replace("models/", "")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            resp = requests.post(url, json=payload, timeout=25)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                try:
                    return json.loads(text)
                except Exception:
                    return {"answer": text, "response_type": "answer", "sources": []}
            else:
                gemini_error = f"Status {resp.status_code}: {resp.text[:150]}"
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            gemini_error = str(e)
            logger.warning(f"Google Gemini JSON generation failed ({e}), falling back to Ollama...")

    # Fallback to Ollama if healthy
    if check_ollama_health():
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
        try:
            response = requests.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate", 
                json=payload, 
                timeout=(5.0, 90.0)
            )
            if response.status_code == 200:
                result_text = response.json().get("response", "{}")
                try:
                    return json.loads(result_text)
                except Exception:
                    return {"answer": result_text, "response_type": "answer", "sources": []}
        except Exception as e:
            logger.warning(f"Ollama generation fallback failed ({e})")

    err_details = f" ({gemini_error})" if gemini_error else ""
    return {
        "answer": f"AI generation service is currently unavailable.{err_details} Please verify your GEMINI_API_KEY or local Ollama service.",
        "response_type": "insufficient_information",
        "sources": []
    }

