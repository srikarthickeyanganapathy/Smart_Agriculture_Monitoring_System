// HSL mapping: Blue (low) -> Red -> Yellow -> Green (high)
export function rainbowColor(value, min = -1, max = 1) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min + 1e-9)));

  // Start at 240 (Blue)
  // Rotate forward by 240 degrees to reach 480 (which is 120/Green)
  // Path: 240(Blue) -> 360(Red) -> 420(Yellow) -> 480(Green)
  const hue = 240 + (ratio * 240); 
  
  return `hsl(${hue}, 85%, 50%)`;
}