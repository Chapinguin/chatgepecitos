# Guide for Python & Jupyter Notebook Team (.ipynb)

To ensure your Jupyter Notebook experiments automatically synchronize with the React frontend without rewriting code during the hackathon:

### 1. Import and run the pipeline module directly in your Notebook:
```python
import sys
sys.path.append("..")
from pipeline import extract_variables_from_tiff

# Test with your local TIFF file
result = extract_variables_from_tiff(
    filepath="path/to/specimen.tiff",
    target_body="Mars", # or "Moon"
    threshold=2.5
)

# Inspect extracted variables dictionary
print("Variables extracted:", result["variables"])
```

### 2. Exporting results directly to the React Dashboard:
Append this cell at the end of your `.ipynb` notebook:
```python
import pandas as pd

# Export your calculated analog match DataFrame:
target_body = "mars"  # or "moon"
df_results.to_csv(f"outputs/earth_with_{target_body}_variables.csv", index=False)
print("✅ CSV updated for Chatgepecitos Frontend")
```

The React dashboard will automatically detect and render the updated metrics, charts, and Copilot reasoning!
