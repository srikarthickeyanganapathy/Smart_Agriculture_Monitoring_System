import numpy as np

def preprocess_yield_input(agro_dict, preproc):
    agro_numeric = preproc["agro_numeric"]
    ohe = preproc["ohe"]
    agro_scaler = preproc["agro_scaler"]

    numeric_values = [agro_dict.get(col, 0) for col in agro_numeric]
    numeric_values = np.array(numeric_values).reshape(1, -1)

    if agro_scaler is not None:
        numeric_values = agro_scaler.transform(numeric_values)

    if ohe is not None:
        # There may be no categorical values in this flow, so skip for now
        pass

    return numeric_values.flatten()
