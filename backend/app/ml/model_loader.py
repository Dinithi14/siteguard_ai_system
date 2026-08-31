"""
Loads the trained model artifacts (produced by train_model.py) once, at
import time, so every request reuses the same in-memory model instead of
reloading it from disk each time.
"""
import json
import joblib
from xgboost import XGBClassifier, XGBRegressor
from app.core.config import settings

MODEL_LOADED = False
MODEL_METRICS: dict = {}
encoders = None
clf = None
reg = None

try:
    encoders = joblib.load(f"{settings.MODEL_DIR}/encoders.pkl")

    clf = XGBClassifier()
    clf.load_model(f"{settings.MODEL_DIR}/delay_classifier.json")

    reg = XGBRegressor()
    reg.load_model(f"{settings.MODEL_DIR}/delay_regressor.json")

    with open(f"{settings.MODEL_DIR}/metrics.json") as f:
        MODEL_METRICS = json.load(f)

    MODEL_LOADED = True
except FileNotFoundError:
    MODEL_LOADED = False
    MODEL_METRICS = {}
    print("WARNING: model files not found. Run `python train_model.py` first.")
