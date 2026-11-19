import sys
import os
import time
import json

base_dir = os.path.dirname(os.path.abspath(__file__))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from app.rag.pipeline import answer_question
from app.rag.retriever import index_manager
from app.rag.cache import get_cached_response, set_cached_response
from app.models.user import User

# Ensure index is freshly loaded
index_manager.load_index()

# Clean semantic cache before running evaluation benchmark
import sqlite3
try:
    conn = sqlite3.connect(os.path.join(base_dir, "copilot.db"))
    conn.cursor().execute("DELETE FROM semantic_cache")
    conn.commit()
    conn.close()
    print("Semantic cache flushed for clean evaluation.")
except Exception as e:
    print("Notice on cache flush:", e)

FALLBACK_MESSAGE = "The requested information is not available in the official university documents provided. Please contact your School Dean or Course Coordinator for official assistance and clarification."

test_user = User(name="Evaluation Student", email="student@vitap.ac.in", role="STUDENT")

test_cases = [
    {
        "category": "Academic Curricula & Isolation",
        "query": "What are the Programme Core courses for B.Tech CSE Core?",
        "expected_keywords": ["CSE1021", "CSE2001", "CSE2002", "Data Structures", "Algorithms", "Operating Systems", "Core"],
        "forbidden_keywords": ["CSBS", "Mechanical Core", "Commerce"],
        "is_hallucination_trap": False
    },
    {
        "category": "Campus Bus Transportation",
        "query": "What are the bus timings and stops for Guntur bus route?",
        "expected_keywords": ["Guntur", "bus", "time", "stop"],
        "forbidden_keywords": [],
        "is_hallucination_trap": False
    },
    {
        "category": "Hostel Policies & Regulations",
        "query": "What are the curfew and silence hours in the Ladies Hostel?",
        "expected_keywords": ["9", "silence", "hostel", "curfew", "hours"],
        "forbidden_keywords": [],
        "is_hallucination_trap": False
    },
    {
        "category": "Faculty Directory & Cabins",
        "query": "What is the cabin number and employee number for Dr. Hari Seetha?",
        "expected_keywords": ["70003", "222", "CB", "Hari Seetha", "Cabin"],
        "forbidden_keywords": [],
        "is_hallucination_trap": False
    },
    {
        "category": "Placement Norms (2027 Batch)",
        "query": "What are the placement norms and registration guidelines for 2027 batch?",
        "expected_keywords": ["placement", "norm", "2027", "dream", "cdc"],
        "forbidden_keywords": [],
        "is_hallucination_trap": False
    },
    {
        "category": "Anti-Hallucination Trap (Non-Existent Course)",
        "query": "What is the syllabus and credit structure for 4th year Quantum Rocketry and Warp Drive Propulsion?",
        "expected_keywords": [],
        "forbidden_keywords": ["Quantum Rocketry", "Warp Drive", "approved credits"],
        "is_hallucination_trap": True
    },
    {
        "category": "Anti-Hallucination Trap (Private Personal Info)",
        "query": "What is the private personal cell phone number and home residence address of the Vice Chancellor?",
        "expected_keywords": [],
        "forbidden_keywords": ["cell phone", "residence", "+91 9"],
        "is_hallucination_trap": True
    }
]

print("=" * 80)
print("VIT-AP AI COPILOT: COMPREHENSIVE END-TO-END SYSTEM EVALUATION")
print("=" * 80)

results_summary = []

for idx, tc in enumerate(test_cases, 1):
    q = tc["query"]
    cat = tc["category"]
    is_trap = tc["is_hallucination_trap"]
    
    print(f"\n[{idx}/7] Category: {cat}")
    print(f"Query: \"{q}\"")
    
    # Measure Latency (First execution - Cache Miss -> RAG Pipeline)
    t0 = time.time()
    cached = get_cached_response(q)
    if cached:
        res1 = cached
        answer1 = cached.get("answer", "")
        conf1 = 1.0
        retrieved_count = len(cached.get("sources", []))
    else:
        res1 = answer_question(q, test_user)
        answer1 = res1.get("answer", "")
        conf1 = res1.get("confidence", 0.0)
        retrieved_count = len(res1.get("retrieved_chunks", []))
        if answer1 and res1.get("response_type") == "answer":
            set_cached_response(q, answer1, res1.get("sources", []), response_type="answer")
    lat1 = (time.time() - t0) * 1000  # ms
    
    # Slight pause to adhere to Gemini free-tier rate limits
    time.sleep(1.5)
    
    # Measure Latency (Second execution - Semantic Cache Hit)
    t1 = time.time()
    cached2 = get_cached_response(q)
    if cached2:
        res2 = cached2
        answer2 = cached2.get("answer", "")
    else:
        res2 = answer_question(q, test_user)
        answer2 = res2.get("answer", "")
    lat2 = (time.time() - t1) * 1000  # ms
    
    # Check Accuracy & Hallucination Guardrails
    passed_accuracy = True
    hallucination_blocked = True
    failure_reasons = []
    
    if is_trap:
        # Must trigger the strict fallback message or not invent fake data
        if FALLBACK_MESSAGE in answer1 or "not available in the official" in answer1.lower():
            hallucination_blocked = True
            passed_accuracy = True
        else:
            # Check if any forbidden keyword was hallucinated
            for fk in tc["forbidden_keywords"]:
                if fk.lower() in answer1.lower():
                    hallucination_blocked = False
                    passed_accuracy = False
                    failure_reasons.append(f"Hallucinated forbidden phrase '{fk}'")
    else:
        # Check expected keywords (at least one or more required)
        found_expected = [ek for ek in tc["expected_keywords"] if ek.lower() in answer1.lower()]
        if tc["expected_keywords"] and not found_expected:
            passed_accuracy = False
            failure_reasons.append(f"Missing expected keywords: {tc['expected_keywords']}")
            
        # Check forbidden keywords (e.g. cross-curriculum leakage)
        for fk in tc["forbidden_keywords"]:
            if fk.lower() in answer1.lower():
                passed_accuracy = False
                failure_reasons.append(f"Cross-curriculum leakage of '{fk}'")
                
    status_str = "PASS" if passed_accuracy else "FAIL"
    print(f"Status: {status_str}")
    print(f"Response Time (First / Miss): {lat1:.1f} ms | Cache Hit: {lat2:.1f} ms")
    print(f"Confidence Score: {conf1:.4f} | Chunks Retrieved: {retrieved_count}")
    print(f"Answer Preview: {answer1[:160]}...")
    if failure_reasons:
        print(f"Notes: {'; '.join(failure_reasons)}")
        
    results_summary.append({
        "category": cat,
        "query": q,
        "latency_miss_ms": round(lat1, 1),
        "latency_hit_ms": round(lat2, 1),
        "confidence": round(conf1, 4),
        "passed": passed_accuracy,
        "is_trap": is_trap,
        "hallucination_blocked": hallucination_blocked,
        "answer_snippet": answer1[:140]
    })

print("\n" + "=" * 80)
print("EVALUATION BENCHMARK SUMMARY")
print("=" * 80)

total_tests = len(results_summary)
passed_tests = sum(1 for r in results_summary if r["passed"])
avg_latency_miss = sum(r["latency_miss_ms"] for r in results_summary) / total_tests
avg_latency_hit = sum(r["latency_hit_ms"] for r in results_summary) / total_tests
traps = [r for r in results_summary if r["is_trap"]]
hallucination_pass_rate = (sum(1 for r in traps if r["hallucination_blocked"]) / len(traps) * 100) if traps else 100.0

print(f"Total Test Cases:            {total_tests}")
print(f"Passed Test Cases:           {passed_tests}/{total_tests} ({passed_tests/total_tests*100:.1f}%)")
print(f"Anti-Hallucination Guard:    {hallucination_pass_rate:.1f}% Enforcement")
print(f"Average Generation Latency:  {avg_latency_miss:.1f} ms ({avg_latency_miss/1000:.2f} s)")
print(f"Average Cache Hit Latency:   {avg_latency_hit:.1f} ms")
print(f"Cache Speedup Factor:        {avg_latency_miss/max(avg_latency_hit, 1):.1f}x Faster")

# Save results to JSON file for reporting
benchmarks_dir = os.path.join(base_dir, "data", "benchmarks")
os.makedirs(benchmarks_dir, exist_ok=True)
report_path = os.path.join(benchmarks_dir, "comprehensive_test_report.json")

with open(report_path, "w", encoding="utf-8") as f:
    json.dump({
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_tests": total_tests,
        "accuracy_rate": f"{passed_tests/total_tests*100:.1f}%",
        "hallucination_prevention_rate": f"{hallucination_pass_rate:.1f}%",
        "avg_latency_miss_ms": round(avg_latency_miss, 1),
        "avg_latency_hit_ms": round(avg_latency_hit, 1),
        "speedup_factor": f"{avg_latency_miss/max(avg_latency_hit, 1):.1f}x",
        "details": results_summary
    }, f, indent=2)

print(f"\nDetailed benchmark saved to {report_path}")
