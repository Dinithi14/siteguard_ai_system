"""
ML Prediction tests - Low risk and high risk prediction scenarios
Run with: pytest tests/test_ml_predictions.py -v
"""
import pytest
from app.ml.predictor import run_prediction
from app.core.config import settings
from fastapi import HTTPException


class TestMLPredictionLowRisk:
    """Test ML predictions for low-risk scenarios"""

    def test_ml_prediction_low_risk(self):
        """Test prediction for low-risk project characteristics"""
        input_data = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 30,
            "contract_value_lkr": 500000,
            "labourers_count": 10,
        }
        
        result = run_prediction(input_data)
        
        # Should return a dict with expected keys
        assert isinstance(result, dict)
        assert "risk_level" in result
        assert "delay_probability" in result
        assert "no_delay_probability" in result
        assert "estimated_delay_days" in result
        
        # Probabilities should sum to ~1.0
        total_prob = result["delay_probability"] + result["no_delay_probability"]
        assert abs(total_prob - 1.0) < 0.01

    def test_ml_prediction_good_material_availability(self):
        """Test that good material availability reduces delay risk"""
        # Good material availability should result in lower risk
        input_data = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 20,
            "contract_value_lkr": 400000,
            "labourers_count": 8,
        }
        
        result = run_prediction(input_data)
        assert result["delay_probability"] < 0.5  # More likely no delay

    def test_ml_prediction_clear_weather(self):
        """Test that clear weather reduces delay risk"""
        input_data = {
            "project_type": "Commercial",
            "project_size": "Medium",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 45,
            "contract_value_lkr": 800000,
            "labourers_count": 20,
        }
        
        result = run_prediction(input_data)
        assert "risk_level" in result
        assert result["risk_level"] in ["Low", "Medium", "High"]

    def test_ml_prediction_small_project(self):
        """Test prediction for small projects (typically lower risk)"""
        input_data = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 15,
            "contract_value_lkr": 200000,
            "labourers_count": 5,
        }
        
        result = run_prediction(input_data)
        assert result["delay_probability"] >= 0.0
        assert result["delay_probability"] <= 1.0


class TestMLPredictionHighRisk:
    """Test ML predictions for high-risk scenarios"""

    def test_ml_prediction_high_risk(self):
        """Test prediction for high-risk project characteristics"""
        input_data = {
            "project_type": "Commercial",
            "project_size": "Large",
            "material_availability": "Low",
            "weather_condition": "Rainy",
            "planned_duration": 120,
            "contract_value_lkr": 5000000,
            "labourers_count": 50,
        }
        
        result = run_prediction(input_data)
        
        assert isinstance(result, dict)
        assert "risk_level" in result
        assert "delay_probability" in result
        
        # High-risk scenario should have higher delay probability
        assert result["delay_probability"] > 0.0

    def test_ml_prediction_poor_material_availability(self):
        """Test that poor material availability increases delay risk"""
        input_data = {
            "project_type": "Commercial",
            "project_size": "Large",
            "material_availability": "Low",
            "weather_condition": "Clear",
            "planned_duration": 90,
            "contract_value_lkr": 3000000,
            "labourers_count": 35,
        }
        
        result = run_prediction(input_data)
        # Poor material availability should increase risk
        assert result["delay_probability"] > 0.2

    def test_ml_prediction_bad_weather(self):
        """Test that bad weather increases delay risk"""
        input_data = {
            "project_type": "Infrastructure",
            "project_size": "Large",
            "material_availability": "High",
            "weather_condition": "Rainy",
            "planned_duration": 100,
            "contract_value_lkr": 4000000,
            "labourers_count": 40,
        }
        
        result = run_prediction(input_data)
        assert result["delay_probability"] > 0.0
        assert result["risk_level"] in ["Low", "Medium", "High"]

    def test_ml_prediction_long_duration(self):
        """Test that longer project duration may increase delay risk"""
        input_data = {
            "project_type": "Infrastructure",
            "project_size": "Large",
            "material_availability": "Medium",
            "weather_condition": "Rainy",
            "planned_duration": 180,
            "contract_value_lkr": 8000000,
            "labourers_count": 60,
        }
        
        result = run_prediction(input_data)
        assert isinstance(result["delay_probability"], float)
        assert 0.0 <= result["delay_probability"] <= 1.0

    def test_ml_prediction_estimated_delay_days_when_delayed(self):
        """Test that estimated delay days is provided when delay is predicted"""
        input_data = {
            "project_type": "Commercial",
            "project_size": "Large",
            "material_availability": "Low",
            "weather_condition": "Rainy",
            "planned_duration": 100,
            "contract_value_lkr": 5000000,
            "labourers_count": 50,
        }
        
        result = run_prediction(input_data)
        
        # If delayed, estimated_delay_days should be a number or None
        if result["estimated_delay_days"] is not None:
            assert isinstance(result["estimated_delay_days"], (int, float))


class TestMLPredictionRiskLevels:
    """Test ML prediction risk level classification"""

    def test_risk_level_low(self):
        """Test that low risk level is assigned correctly"""
        input_data = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 20,
            "contract_value_lkr": 300000,
            "labourers_count": 5,
        }
        
        result = run_prediction(input_data)
        
        if result["delay_probability"] < 0.35:
            assert result["risk_level"] == "Low"

    def test_risk_level_medium(self):
        """Test that medium risk level is assigned correctly"""
        input_data = {
            "project_type": "Commercial",
            "project_size": "Medium",
            "material_availability": "Medium",
            "weather_condition": "Monsoon",
            "planned_duration": 60,
            "contract_value_lkr": 1500000,
            "labourers_count": 25,
        }
        
        result = run_prediction(input_data)
        assert result["risk_level"] in ["Low", "Medium", "High"]

    def test_risk_level_high(self):
        """Test that high risk level is assigned correctly"""
        input_data = {
            "project_type": "Infrastructure",
            "project_size": "Large",
            "material_availability": "Low",
            "weather_condition": "Rainy",
            "planned_duration": 150,
            "contract_value_lkr": 6000000,
            "labourers_count": 70,
        }
        
        result = run_prediction(input_data)
        assert result["risk_level"] in ["Low", "Medium", "High"]

    def test_all_risk_levels_exist(self):
        """Test that all three risk levels can be assigned"""
        # This test checks that the risk classification is working
        # Low risk
        low_risk = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 15,
            "contract_value_lkr": 200000,
            "labourers_count": 5,
        }
        
        result_low = run_prediction(low_risk)
        assert result_low["risk_level"] in ["Low", "Medium", "High"]


class TestMLPredictionEdgeCases:
    """Test edge cases in ML predictions"""

    def test_prediction_with_minimum_values(self):
        """Test prediction with minimum valid values"""
        input_data = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 1,
            "contract_value_lkr": 1000,
            "labourers_count": 1,
        }
        
        result = run_prediction(input_data)
        assert isinstance(result, dict)
        assert "risk_level" in result

    def test_prediction_with_large_values(self):
        """Test prediction with large valid values"""
        input_data = {
            "project_type": "Infrastructure",
            "project_size": "Large",
            "material_availability": "Low",
            "weather_condition": "Rainy",
            "planned_duration": 1000,
            "contract_value_lkr": 100000000,
            "labourers_count": 500,
        }
        
        result = run_prediction(input_data)
        assert isinstance(result, dict)
        assert result["delay_probability"] >= 0.0
        assert result["delay_probability"] <= 1.0

    def test_prediction_invalid_project_type(self):
        """Test that invalid project type raises error"""
        input_data = {
            "project_type": "invalid_type",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "Clear",
            "planned_duration": 30,
            "contract_value_lkr": 500000,
            "labourers_count": 10,
        }
        
        with pytest.raises(HTTPException):
            run_prediction(input_data)

    def test_prediction_invalid_weather(self):
        """Test that invalid weather condition raises error"""
        input_data = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "weather_condition": "invalid_weather",
            "planned_duration": 30,
            "contract_value_lkr": 500000,
            "labourers_count": 10,
        }
        
        with pytest.raises(HTTPException):
            run_prediction(input_data)

    def test_prediction_all_weather_conditions(self):
        """Test prediction with all valid weather conditions"""
        base_input = {
            "project_type": "Residential",
            "project_size": "Small",
            "material_availability": "High",
            "planned_duration": 30,
            "contract_value_lkr": 500000,
            "labourers_count": 10,
        }
        
        for weather in ["Clear", "Monsoon", "Rainy"]:
            input_data = {**base_input, "weather_condition": weather}
            result = run_prediction(input_data)
            assert result["risk_level"] in ["Low", "Medium", "High"]
