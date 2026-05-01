"""
╔══════════════════════════════════════════════════════════════════╗
║  End-to-End Latency Benchmark                                   ║
║  For IEEE Paper: Smart Agriculture Monitoring System             ║
║                                                                  ║
║  Measures: Simulator → Spring Boot → Python ML → MySQL → Response║
║  Method:   20 sequential full-pipeline requests                  ║
╚══════════════════════════════════════════════════════════════════╝

This script acts as the IoT Simulator. It sends a payload to the 
Spring Boot backend, which then:
  1. Calls the Python FastAPI ML service (/stateful/compat/step)
  2. Runs yield + disease ML models
  3. Saves results to MySQL (FieldHistory table)
  4. Returns the response

The measured time = TRUE end-to-end latency across all 3 services + DB.

Prerequisites:
  - Spring Boot running on port 8080
  - FastAPI ML service running on port 8001
  - MySQL running with configured credentials
  - pip install requests
"""

import time
import statistics
import requests

# ─── Configuration ──────────────────────────────────────────────
SPRING_BOOT_BASE = "http://127.0.0.1:8080/api/v1"
TOTAL_REQUESTS = 20
WARMUP_REQUESTS = 3

# Authentication endpoint
AUTH_URL = "http://127.0.0.1:8080/api/auth/login"
AUTH_PAYLOAD = {"username": "admin", "password": "password123"}

# The simulation trigger endpoint — this invokes the FULL pipeline:
# Spring Boot → Python ML (stateful/compat/step) → MySQL persistence → Response
SIMULATION_START_URL = f"{SPRING_BOOT_BASE}/analytics/start"
FIELDS_URL = f"{SPRING_BOOT_BASE}/analytics/fields"


def get_auth_token():
    """Attempt to get JWT token. Returns headers dict."""
    try:
        resp = requests.post(AUTH_URL, json=AUTH_PAYLOAD, timeout=5)
        if resp.status_code == 200:
            token = resp.json().get("token", "")
            print(f"  ✓ Authenticated successfully")
            return {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"  ⚠ Auth failed ({e}), continuing without token...")
    return {}


def run_benchmark():
    print("=" * 65)
    print("  End-to-End Latency Benchmark")
    print("  Simulator → Spring Boot → FastAPI ML → MySQL → Response")
    print("=" * 65)

    # ─── Connectivity check ─────────────────────────────────────
    try:
        r = requests.get("http://127.0.0.1:8080/api/v1/analytics/fields", timeout=5)
        print(f"\n✓ Spring Boot reachable (status={r.status_code})")
    except requests.ConnectionError:
        print("\n✗ ERROR: Cannot connect to Spring Boot on localhost:8080.")
        print("  Start with: cd backend/agro && mvn spring-boot:run")
        return

    try:
        r = requests.get("http://127.0.0.1:8001/", timeout=5)
        print(f"✓ FastAPI ML service reachable (status={r.status_code})")
    except requests.ConnectionError:
        print("✗ WARNING: FastAPI not reachable on 8001. E2E pipeline may fail.")

    # ─── Authentication ─────────────────────────────────────────
    print("\n▸ Authenticating...")
    headers = get_auth_token()

    # ─── Warm-up phase ──────────────────────────────────────────
    print(f"\n▸ Running {WARMUP_REQUESTS} warm-up cycles (discarded)...")
    for _ in range(WARMUP_REQUESTS):
        try:
            requests.get(SIMULATION_START_URL, headers=headers, timeout=30)
        except Exception:
            pass
        time.sleep(1)  # Brief pause between warm-up cycles

    # ─── Measurement phase ──────────────────────────────────────
    latencies = []
    errors = 0

    print(f"\n▸ Running {TOTAL_REQUESTS} measured E2E requests...\n")
    for i in range(TOTAL_REQUESTS):
        # Timestamp right BEFORE sending (simulates IoT sensor data generation moment)
        t_start = time.perf_counter()

        try:
            # This triggers the FULL pipeline:
            # 1. Spring Boot receives request
            # 2. Spring Boot calls Python ML (/stateful/compat/step)  
            # 3. Python ML runs yield + disease models
            # 4. Spring Boot receives ML results
            # 5. Spring Boot saves to MySQL (FieldHistory)
            # 6. HTTP 200 response returned
            resp = requests.get(SIMULATION_START_URL, headers=headers, timeout=60)

            # Timestamp the MOMENT we receive the response
            t_end = time.perf_counter()
            elapsed = t_end - t_start

            if resp.status_code == 200:
                latencies.append(elapsed)
                if (i + 1) % 5 == 0 or i == 0:
                    print(f"  [{i+1:3d}/{TOTAL_REQUESTS}] E2E latency: {elapsed:.4f} s ({elapsed*1000:.1f} ms)")
            else:
                errors += 1
                elapsed_err = t_end - t_start
                print(f"  [{i+1:3d}/{TOTAL_REQUESTS}] HTTP {resp.status_code} ({elapsed_err:.4f} s)")

        except requests.Timeout:
            t_end = time.perf_counter()
            errors += 1
            print(f"  [{i+1:3d}/{TOTAL_REQUESTS}] TIMEOUT (>{60}s)")
        except Exception as e:
            t_end = time.perf_counter()
            errors += 1
            print(f"  [{i+1:3d}/{TOTAL_REQUESTS}] Exception: {e}")

        # Small pause between iterations to avoid overwhelming the pipeline
        time.sleep(0.5)

    # ─── Results ────────────────────────────────────────────────
    if not latencies:
        print("\n✗ No successful requests. Cannot compute E2E latency.")
        print("  Ensure all 3 services (Spring Boot, FastAPI, MySQL) are running.")
        return

    latencies.sort()
    avg = statistics.mean(latencies)
    med = statistics.median(latencies)
    mn = min(latencies)
    mx = max(latencies)
    std = statistics.stdev(latencies) if len(latencies) > 1 else 0
    p95 = latencies[int(len(latencies) * 0.95)]

    print("\n" + "=" * 65)
    print("  RESULTS — End-to-End Latency")
    print("  (Simulator → Spring Boot → FastAPI ML → MySQL → Response)")
    print("=" * 65)
    print(f"  Successful cycles   : {len(latencies)}/{TOTAL_REQUESTS}")
    print(f"  Failed cycles       : {errors}")
    print(f"  ────────────────────────────────────────")
    print(f"  Average E2E latency : {avg:.4f} s  ({avg*1000:.1f} ms)")
    print(f"  Median E2E latency  : {med:.4f} s  ({med*1000:.1f} ms)")
    print(f"  Min E2E latency     : {mn:.4f} s  ({mn*1000:.1f} ms)")
    print(f"  Max E2E latency     : {mx:.4f} s  ({mx*1000:.1f} ms)")
    print(f"  Std deviation       : {std:.4f} s  ({std*1000:.1f} ms)")
    print(f"  95th percentile     : {p95:.4f} s  ({p95*1000:.1f} ms)")
    print(f"  ────────────────────────────────────────")
    print(f"\n  ╔═══════════════════════════════════════════════════════════════╗")
    print(f"  ║  FOR IEEE PAPER:                                              ║")
    print(f"  ║  Average E2E latency (Simulator→Backend→DB): {avg:.4f} s       ║")
    print(f"  ╚═══════════════════════════════════════════════════════════════╝")


if __name__ == "__main__":
    run_benchmark()
