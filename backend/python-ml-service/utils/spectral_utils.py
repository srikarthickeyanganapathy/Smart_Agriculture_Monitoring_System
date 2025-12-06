import numpy as np

def dict_to_spectral_array(spectral_dict: dict):
    """
    Converts spectral dictionary into a sorted array
    e.g., {"X437":1.2, "X447":1.1 ...}
    """
    if spectral_dict is None:
        return np.zeros(150)  # default 150 bands

    sorted_keys = sorted(spectral_dict.keys(), key=lambda x: int(x[1:]))
    arr = np.array([spectral_dict[k] for k in sorted_keys], dtype=float)
    return arr.reshape(-1, 1)   # CNN expects (seq_len, 1)
