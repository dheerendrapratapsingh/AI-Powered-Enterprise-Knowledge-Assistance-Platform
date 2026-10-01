import requests
import json
from app.config import settings

def check_ollama_health() -> bool:
    try:
        response = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2)
        return response.status_code == 200
    except requests.RequestException:
        return False

def generate_response(prompt: str) -> dict:
    if not check_ollama_health():
        raise RuntimeError("AI service is currently unavailable. Please make sure Ollama is running and the configured model is available.")
        
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    response = requests.post(f"{settings.OLLAMA_BASE_URL}/api/generate", json=payload)
    if response.status_code != 200:
        raise RuntimeError(f"Ollama generation failed: {response.text}")
        
    result_text = response.json().get("response", "{}")
    try:
        parsed = json.loads(result_text)
        return parsed
    except json.JSONDecodeError:
        return {
            "answer": result_text,
            "response_type": "answer",
            "sources": []
        }
