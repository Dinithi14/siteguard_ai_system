"""
SiteGuard AI - Metrics Evaluation Script
-----------------------------------------
Loads and displays the trained model metrics from metrics.json

Run this after training the models:
    python evaluate_metrics.py
"""

import json
import os
from pathlib import Path

MODEL_DIR = "app/ml/model"
METRICS_FILE = f"{MODEL_DIR}/metrics.json"


def main():
    if not os.path.exists(METRICS_FILE):
        print(f"Error: {METRICS_FILE} not found!")
        print("Please run 'python train_model.py' first to train the models.")
        return

    with open(METRICS_FILE, "r") as f:
        metrics = json.load(f)

    print("\n" + "=" * 60)
    print("SiteGuard AI - Model Metrics Evaluation")
    print("=" * 60)

    # --- Classification Metrics ---
    if "classification" in metrics:
        print("\n📊 CLASSIFICATION MODEL (Delay Risk Prediction)")
        print("-" * 60)
        clf_metrics = metrics["classification"]
        
        print(f"  Accuracy:          {clf_metrics.get('accuracy', 'N/A')}")
        print(f"  Precision:         {clf_metrics.get('precision', 'N/A')}")
        print(f"  Recall:            {clf_metrics.get('recall', 'N/A')}")
        print(f"  F1 Score:          {clf_metrics.get('f1_score', 'N/A')}")
        print(f"  Test Set Size:     {clf_metrics.get('test_set_size', 'N/A')} samples")
        
        if "confusion_matrix" in clf_metrics:
            cm = clf_metrics["confusion_matrix"]
            print(f"\n  Confusion Matrix:")
            print(f"    True Negatives:  {cm[0][0]}")
            print(f"    False Positives: {cm[0][1]}")
            print(f"    False Negatives: {cm[1][0]}")
            print(f"    True Positives:  {cm[1][1]}")

    # --- Regression Metrics ---
    if "regression" in metrics:
        print("\n📏 REGRESSION MODEL (Delay Days Prediction)")
        print("-" * 60)
        reg_metrics = metrics["regression"]
        
        print(f"  MAE (days):        {reg_metrics.get('mean_absolute_error_days', 'N/A')}")
        print(f"  Test Set Size:     {reg_metrics.get('test_set_size', 'N/A')} delayed projects")

    # --- Feature Importance ---
    if "feature_importance" in metrics:
        print("\n🎯 FEATURE IMPORTANCE")
        print("-" * 60)
        importance = metrics["feature_importance"]
        for feature, score in sorted(importance.items(), key=lambda x: -x[1]):
            bar_length = int(score * 50)
            bar = "█" * bar_length
            print(f"  {feature:<30} {score:.4f} {bar}")

    print("\n" + "=" * 60)
    print("Metrics loaded from:", METRICS_FILE)
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
