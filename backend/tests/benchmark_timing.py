import time
import requests
import json

login_res = requests.post(
    'http://127.0.0.1:8000/api/auth/login',
    json={'email': 'student@vitap.ac.in', 'password': 'student123'}
)
token = login_res.json().get('access_token')
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

def benchmark(query):
    t0 = time.perf_counter()
    first_token_time = None
    r = requests.post(
        'http://127.0.0.1:8000/api/chat/stream',
        headers=headers,
        json={'question': query},
        stream=True
    )
    tokens = 0
    for line in r.iter_lines():
        if not line:
            continue
        line_str = line.decode('utf-8')
        if '"type": "token"' in line_str:
            if first_token_time is None:
                first_token_time = time.perf_counter() - t0
            tokens += 1
    total_time = time.perf_counter() - t0
    ttft_ms = (first_token_time * 1000) if first_token_time else 0.0
    return ttft_ms, total_time, tokens

print("=== LIVE ENDPOINT BENCHMARK ===")
for q in ["Hello", "Good morning", "What can you do?"]:
    ttft_ms, total_s, tokens = benchmark(q)
    print(f"Query: '{q}'")
    print(f"  First Token Latency (TTFT): {ttft_ms:.2f} ms")
    print(f"  Complete Response Time:     {total_s:.3f} s ({tokens} tokens)")
