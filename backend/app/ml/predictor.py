"""
Pure prediction logic: turns validated request data into a risk
prediction using the loaded XGBoost classifier + regressor.
"""
import pandas as pd
from fastapi import HTTPException
from app.core.config import settings
from app.ml.model_loader import clf, reg, encoders, MODEL_LOADED


def run_prediction(input_dict: dict) -> dict:
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model not trained yet. Run train_model.py first.")

    row = {}
    for col in settings.CATEGORICAL_COLS:
        le = encoders[col]
        value = input_dict[col]
        if value not in le.classes_:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown value '{value}' for '{col}'. Expected one of: {list(le.classes_)}",
            )
        row[col] = le.transform([value])[0]
    for col in settings.NUMERIC_COLS:
        row[col] = input_dict[col]

    X = pd.DataFrame([row])[settings.FEATURE_COLS]

    delay_probability = float(clf.predict_proba(X)[0][1])
    is_delayed_pred = int(clf.predict(X)[0])

    if delay_probability < 0.35:
        risk_level = "Low"
    elif delay_probability < 0.65:
        risk_level = "Medium"
    else:
        risk_level = "High"

    estimated_delay_days = None
    if is_delayed_pred == 1:
        estimated_delay_days = round(float(reg.predict(X)[0]), 0)

    return {
        "risk_level": risk_level,
        "delay_probability": round(delay_probability, 3),
        "no_delay_probability": round(1 - delay_probability, 3),
        "estimated_delay_days": estimated_delay_days,
    }

def generate_prescriptive_recommendations(input_dict: dict, project_milestones: list) -> list[dict]:
    """
    Generate transparent, rule-based prescriptive recommendations 
    using the ML input snapshot and current milestone status.
    """
    recs = []

    # 1. Material Availability
    if input_dict.get("material_availability") == "Low":
        recs.append({
            "factor": "Low Material Availability",
            "severity": "High",
            "recommendation": "Critical material shortage detected. Consider expediting material procurement."
        })

    # 2. Weather Condition
    weather = input_dict.get("weather_condition")
    if weather == "Monsoon":
        recs.append({
            "factor": "Monsoon Weather",
            "severity": "High",
            "recommendation": "Severe weather conditions detected. Consider securing the site and adjusting external work activities."
        })
    elif weather == "Rainy":
        recs.append({
            "factor": "Rainy Weather",
            "severity": "Medium",
            "recommendation": "Rainy conditions may affect outdoor construction activities. Consider adjusting the work schedule."
        })
        
    # 3. Labour Availability (Relative threshold rule based on project size)
    labour = input_dict.get("labourers_count", 0)
    size = input_dict.get("project_size")
    # Derived from average labour counts in the dataset: Small ~15, Medium ~45, Large ~120
    is_labour_low = False
    if size == "Small" and labour < 10:
        is_labour_low = True
    elif size == "Medium" and labour < 30:
        is_labour_low = True
    elif size == "Large" and labour < 80:
        is_labour_low = True
        
    if is_labour_low:
        recs.append({
            "factor": "Low Labour Force",
            "severity": "Medium",
            "recommendation": "Labour availability may affect progress. Consider allocating additional workers."
        })

    # 4. Milestone Check
    has_delayed = False
    has_blocked = False
    for ms in project_milestones:
        if ms.status == "DELAYED":
            has_delayed = True
        elif ms.status == "BLOCKED":
            has_blocked = True

    if has_delayed:
        recs.append({
            "factor": "Delayed Milestone",
            "severity": "High",
            "recommendation": "Milestone delay detected. Review the milestone schedule and prepare a recovery plan."
        })
    
    if has_blocked:
        recs.append({
            "factor": "Blocked Milestone",
            "severity": "High",
            "recommendation": "Blocked milestone detected. Identify and resolve the blocking issue before proceeding."
        })

    # 5. Default Fallback
    if len(recs) == 0:
        recs.append({
            "factor": "No Major Risks",
            "severity": "Low",
            "recommendation": "Currently, no major actionable risk factors were identified from the available project data."
        })

    return recs

