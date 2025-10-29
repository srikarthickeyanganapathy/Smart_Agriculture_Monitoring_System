import os
import numpy as np

async def load_npy(file_path: str):
    if file_path.startswith("file://"):
        file_path = file_path.replace("file://", "")
    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path)
    arr = np.load(file_path, allow_pickle=False)
    return arr

async def predict_crop_from_uri(file_uri: str, fieldId: str = None) -> dict:
    arr = await load_npy(file_uri)
    # simplistic mock classifier
    if arr.ndim == 3:
        mean_spec = arr.mean(axis=(0,1))
        label = "maize" if mean_spec[0] > mean_spec[-1] else "wheat"
        conf = float(min(0.99, 0.5 + abs(mean_spec[0]-mean_spec[-1]) * 0.01))
    else:
        label = "invalid"
        conf = 0.0

    # produce a small NDVI-like heatmap file
    heatmap_path = None
    try:
        b0 = arr[:,:,0].astype(float)
        b1 = arr[:,:,-1].astype(float)
        denom = (b1 + b0)
        ndvi = (b1 - b0) / (denom + 1e-6)
        outdir = os.path.join(os.getcwd(), "storage", "predictions")
        os.makedirs(outdir, exist_ok=True)
        fname = os.path.basename(file_uri).replace(os.sep, "_") + "_ndvi.npy"
        outpath = os.path.join(outdir, fname)
        np.save(outpath, ndvi)
        heatmap_path = outpath
    except Exception:
        heatmap_path = None

    return {"result": {"label": label, "confidence": conf}, "model": "mock-spectral-v1", "spatialMapUri": heatmap_path}
