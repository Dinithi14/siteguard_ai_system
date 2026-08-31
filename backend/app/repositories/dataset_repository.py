"""
Loads dataset.csv once at import time and exposes it to services.
Any code that needs the raw training dataset goes through here, instead
of reading the CSV directly elsewhere.
"""
import pandas as pd
from app.core.config import settings

df: pd.DataFrame = pd.read_csv(settings.DATASET_PATH)


def get_dataset() -> pd.DataFrame:
    return df
