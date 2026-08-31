"""
SiteGuard AI - Model Training Script
-------------------------------------
Trains an XGBoost classifier (delay risk) and an XGBoost regressor
(estimated delay days) on dataset.csv, then saves everything the
backend API needs to make predictions.

Run this once before starting the backend:
    python train_model.py

Outputs (saved into ./model/):
    delay_classifier.json      - trained XGBoost classification model
    delay_regressor.json       - trained XGBoost regression model
    encoders.pkl                - LabelEncoders for categorical columns
    metrics.json                 - accuracy/precision/recall/F1 + regression MAE
"""

import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error, confusion_matrix
)
from xgboost import XGBClassifier, XGBRegressor

DATA_PATH = "app/data/dataset.csv"
MODEL_DIR = "app/ml/model"

CATEGORICAL_COLS = ["project_type", "project_size", "material_availability", "weather_condition"]
NUMERIC_COLS = ["planned_duration", "contract_value_lkr", "labourers_count"]
FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS
TARGET_CLASSIFICATION = "is_delayed"
TARGET_REGRESSION = "delay_days"


def main():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"  {len(df)} rows loaded")

    # --- Encode categorical columns ---
    encoders = {}
    df_encoded = df.copy()
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df_encoded[col] = le.fit_transform(df[col])
        encoders[col] = le
        print(f"  Encoded '{col}': {list(le.classes_)}")

    X = df_encoded[FEATURE_COLS]
    y_class = df_encoded[TARGET_CLASSIFICATION]
    y_reg = df_encoded[TARGET_REGRESSION]

    # --- Train/test split (shared split so results are comparable) ---
    X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42, stratify=y_class
    )

    # --- Classification model: will this project be delayed? ---
    print("\nTraining classification model (delay risk)...")
    clf = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=42,
    )
    clf.fit(X_train, yc_train)
    yc_pred = clf.predict(X_test)

    metrics = {
        "classification": {
            "accuracy": round(accuracy_score(yc_test, yc_pred), 4),
            "precision": round(precision_score(yc_test, yc_pred), 4),
            "recall": round(recall_score(yc_test, yc_pred), 4),
            "f1_score": round(f1_score(yc_test, yc_pred), 4),
            "confusion_matrix": confusion_matrix(yc_test, yc_pred).tolist(),
            "test_set_size": len(yc_test),
        }
    }
    print(f"  Accuracy:  {metrics['classification']['accuracy']}")
    print(f"  Precision: {metrics['classification']['precision']}")
    print(f"  Recall:    {metrics['classification']['recall']}")
    print(f"  F1 score:  {metrics['classification']['f1_score']}")

    # --- Regression model: how many days delayed? (only trained on delayed projects) ---
    print("\nTraining regression model (delay days)...")
    delayed_mask_train = yc_train == 1
    delayed_mask_test = yc_test == 1

    reg = XGBRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
    )
    reg.fit(X_train[delayed_mask_train], yr_train[delayed_mask_train])
    yr_pred = reg.predict(X_test[delayed_mask_test])
    mae = mean_absolute_error(yr_test[delayed_mask_test], yr_pred)
    metrics["regression"] = {
        "mean_absolute_error_days": round(float(mae), 2),
        "test_set_size": int(delayed_mask_test.sum()),
    }
    print(f"  MAE (days): {metrics['regression']['mean_absolute_error_days']}")

    # --- Feature importance (useful for the report / cause analysis screen) ---
    importance = dict(zip(FEATURE_COLS, clf.feature_importances_.tolist()))
    importance = dict(sorted(importance.items(), key=lambda x: -x[1]))
    metrics["feature_importance"] = {k: round(v, 4) for k, v in importance.items()}
    print("\nFeature importance:")
    for k, v in importance.items():
        print(f"  {k}: {v:.4f}")

    # --- Save everything ---
    import os
    os.makedirs(MODEL_DIR, exist_ok=True)
    clf.save_model(f"{MODEL_DIR}/delay_classifier.json")
    reg.save_model(f"{MODEL_DIR}/delay_regressor.json")
    joblib.dump(encoders, f"{MODEL_DIR}/encoders.pkl")
    with open(f"{MODEL_DIR}/metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved model files to ./{MODEL_DIR}/")
    print("Done. You can now start the backend with: uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
