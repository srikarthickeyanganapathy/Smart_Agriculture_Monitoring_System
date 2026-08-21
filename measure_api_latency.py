"""
╔══════════════════════════════════════════════════════════════════╗
║  API Latency Benchmark - FastAPI ML Inference Endpoint         ║
║  For IEEE Paper: Smart Agriculture Monitoring System           ║
║                                                                ║
║  Target:  POST http://localhost:8001/predict/disease           ║
║  Method:  50 sequential requests with realistic payload        ║
╚══════════════════════════════════════════════════════════════════╝

Prerequisites:
  - FastAPI ML service running:  cd backend/python-ml-service && uvicorn main:app --port 8001
  - pip install requests
"""

import time
import statistics
import requests

# ─── Configuration ──────────────────────────────────────────────
FASTAPI_URL = "http://127.0.0.1:8001/predict/disease"
TOTAL_REQUESTS = 50
WARMUP_REQUESTS = 5  # Discarded to avoid cold-start bias

# Scientifically valid payload matching DiseaseRequestTabular schema
# (derived from disease_router.py lines 18-28)
PAYLOAD = {
    "ndvi": 0.72,
    "temperature": 28.5,
    "moisture": 55.0,
    "nitrogen": 65.0,
    "phosphorus": 42.0,
    "potassium": 48.0,
    "irrigation": 35.0,
    "ph": 6.5
}


def run_benchmark():
    print("=" * 60)
    print("  FastAPI Inference Latency Benchmark")
    print("=" * 60)
    print(f"  Target:     {FASTAPI_URL}")
    print(f"  Requests:   {TOTAL_REQUESTS} (+ {WARMUP_REQUESTS} warm-up)")
    print(f"  Payload:    {PAYLOAD}")
    print("=" * 60)

    # ─── Connectivity check ─────────────────────────────────────
    try:
        r = requests.get("http://127.0.0.1:8001/", timeout=5)
        print(f"\n✓ FastAPI service is reachable (status={r.status_code})")
    except requests.ConnectionError:
        print("\n✗ ERROR: Cannot connect to FastAPI on localhost:8001.")
        print("  Start it with: cd backend/python-ml-service && uvicorn main:app --port 8001")
        return

    # ─── Warm-up phase ──────────────────────────────────────────
    print(f"\n▸ Running {WARMUP_REQUESTS} warm-up requests (discarded)...")
    for _ in range(WARMUP_REQUESTS):
        requests.post(FASTAPI_URL, json=PAYLOAD, timeout=10)

    # ─── Measurement phase ──────────────────────────────────────
    latencies = []
    errors = 0

    print(f"▸ Running {TOTAL_REQUESTS} measured requests...\n")
    for i in range(TOTAL_REQUESTS):
        start = time.perf_counter()
        try:
            resp = requests.post(FASTAPI_URL, json=PAYLOAD, timeout=10)
            elapsed = time.perf_counter() - start

            if resp.status_code == 200:
                latencies.append(elapsed)
                if (i + 1) % 10 == 0:
                    print(f"  [{i+1:3d}/{TOTAL_REQUESTS}] {elapsed*1000:.2f} ms")
            else:
                errors += 1
                print(f"  [{i+1:3d}/{TOTAL_REQUESTS}] HTTP {resp.status_code} (error)")
        except Exception as e:
            elapsed = time.perf_counter() - start
            errors += 1
            print(f"  [{i+1:3d}/{TOTAL_REQUESTS}] Exception: {e}")

    # ─── Results ────────────────────────────────────────────────
    if not latencies:
        print("\n✗ No successful responses. Cannot compute metrics.")
        return

    latencies.sort()
    avg = statistics.mean(latencies)
    med = statistics.median(latencies)
    mn = min(latencies)
    mx = max(latencies)
    std = statistics.stdev(latencies) if len(latencies) > 1 else 0
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]

    print("\n" + "=" * 60)
    print("  RESULTS — FastAPI Inference Latency")
    print("=" * 60)
    print(f"  Successful requests : {len(latencies)}/{TOTAL_REQUESTS}")
    print(f"  Failed requests     : {errors}")
    print(f"  ────────────────────────────────────")
    print(f"  Average latency     : {avg:.4f} s  ({avg*1000:.2f} ms)")
    print(f"  Median latency      : {med:.4f} s  ({med*1000:.2f} ms)")
    print(f"  Min latency         : {mn:.4f} s  ({mn*1000:.2f} ms)")
    print(f"  Max latency         : {mx:.4f} s  ({mx*1000:.2f} ms)")
    print(f"  Std deviation       : {std:.4f} s  ({std*1000:.2f} ms)")
    print(f"  95th percentile     : {p95:.4f} s  ({p95*1000:.2f} ms)")
    print(f"  99th percentile     : {p99:.4f} s  ({p99*1000:.2f} ms)")
    print(f"  ────────────────────────────────────")
    print(f"\n  ╔════════════════════════════════════════════════════╗")
    print(f"  ║  FOR IEEE PAPER:                                   ║")
    print(f"  ║  Average API latency (FastAPI inference): {avg:.4f} s ║")
    print(f"  ╚════════════════════════════════════════════════════╝")


if __name__ == "__main__":
    run_benchmark()
