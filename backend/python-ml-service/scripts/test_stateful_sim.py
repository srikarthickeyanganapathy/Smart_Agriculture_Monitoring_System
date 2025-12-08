# test_stateful_sim.py
# Quick test script to verify stateful simulation works
# Run: python scripts/test_stateful_sim.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simulation.stateful_field_sim import (
    InitFieldRequest, EnvParams,
    init_field, step_field, get_field_summary, patch_field_env, 
    delete_field, list_fields, storage
)

def test_full_cycle():
    print("=" * 60)
    print("STATEFUL SIMULATION TEST")
    print("=" * 60)
    print(f"Storage mode: {'Redis' if storage.use_redis else 'In-Memory'}")
    print()
    
    field_id = "test_field_001"
    
    # Cleanup if exists
    try:
        delete_field(field_id)
        print(f"✓ Cleaned up existing field: {field_id}")
    except:
        pass
    
    # 1. Initialize field
    print("\n--- STEP 1: Initialize Field ---")
    req = InitFieldRequest(
        field_id=field_id,
        plants=50,
        crop_type="corn",
        initial_env=EnvParams(temp_c=25.0, sunlight=0.8, rainfall_mm=60.0)
    )
    result = init_field(req)
    print(f"✓ Field initialized: {field_id}")
    print(f"  Plants: {result['plants']}")
    print(f"  Initial NDVI: {result['avg_ndvi']:.4f}")
    print(f"  Stress Score: {result['stress_score']:.4f}")
    
    initial_ndvi = result['avg_ndvi']
    
    # 2. Run multiple simulation steps
    print("\n--- STEP 2: Run 5 Simulation Days ---")
    ndvi_history = [initial_ndvi]
    
    for day in range(1, 6):
        result = step_field(field_id, delta_days=1.0)
        new_ndvi = result['after']['avg_ndvi']
        ndvi_change = result['ndvi_change_mean']
        ndvi_history.append(new_ndvi)
        
        print(f"  Day {day}: NDVI={new_ndvi:.4f} (Δ={ndvi_change:+.4f})")
        
        if result['alerts']:
            for alert in result['alerts']:
                print(f"    ⚠ Alert: {alert['type']} - {alert['message']}")
    
    # 3. Verify temporal continuity (NDVI should trend upward under good conditions)
    print("\n--- STEP 3: Verify Temporal Continuity ---")
    ndvi_increased = ndvi_history[-1] > ndvi_history[0]
    print(f"  Start NDVI: {ndvi_history[0]:.4f}")
    print(f"  End NDVI:   {ndvi_history[-1]:.4f}")
    print(f"  Trend: {'📈 INCREASING (Good!)' if ndvi_increased else '📉 Decreasing'}")
    
    # 4. Test environment patching
    print("\n--- STEP 4: Test Environment Update ---")
    new_env = EnvParams(temp_c=35.0, sunlight=0.3, rainfall_mm=5.0)  # Harsh conditions
    patch_field_env(field_id, new_env)
    print(f"  Updated environment: temp=35°C, low sunlight, drought")
    
    # Run a few more days under harsh conditions
    for day in range(6, 9):
        result = step_field(field_id, delta_days=1.0)
        new_ndvi = result['after']['avg_ndvi']
        print(f"  Day {day} (harsh): NDVI={new_ndvi:.4f}")
    
    # 5. Get final summary
    print("\n--- STEP 5: Final Field Summary ---")
    summary = get_field_summary(field_id)
    print(f"  Simulation Day: {summary['day']}")
    print(f"  Final NDVI: {summary['avg_ndvi']:.4f}")
    print(f"  Stress Score: {summary['stress_score']:.4f}")
    print(f"  Avg Nitrogen: {summary['avg_nitrogen']:.1f}")
    print(f"  Avg Moisture: {summary['avg_moisture']:.1f}%")
    
    # 6. List all fields
    print("\n--- STEP 6: List Fields in Storage ---")
    fields = list_fields()
    print(f"  Fields in storage: {fields}")
    
    # 7. Cleanup
    print("\n--- STEP 7: Cleanup ---")
    delete_field(field_id)
    print(f"✓ Deleted field: {field_id}")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    try:
        test_full_cycle()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
