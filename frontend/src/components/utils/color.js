// HSL mapping: Blue (low) -> Red -> Yellow -> Green (high)
export function rainbowColor(value, min = -1, max = 1) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min + 1e-9)));
  const hue = 240 + (ratio * 240);
  return `hsl(${hue}, 85%, 50%)`;
}

// User requested semantic color mapping for Plant Health (NDVI)
// > 0.7: Healthy (Emerald Green)
// 0.4 - 0.7: Moderate (Sunflower Yellow)
// < 0.4: Unhealthy (Carrot Orange)
// Critical/Dead (e.g. < 0.2): Alizarin Red
export function getNdviColor(ndvi) {
  const n = Number(ndvi);
  if (n > 0.7) return "#2ecc71"; // Emerald Green - Healthy
  if (n >= 0.4) return "#f1c40f"; // Sunflower Yellow - Moderate
  if (n >= 0.2) return "#e67e22"; // Carrot Orange - Unhealthy
  return "#e74c3c"; // Alizarin Red - Critical/Dead/Soil
}