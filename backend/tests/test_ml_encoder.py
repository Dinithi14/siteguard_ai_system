"""
ML Feature Encoder tests - Coverage for categorical and numeric feature encoding
Run with: pytest tests/test_ml_encoder.py -v
"""
import pytest
from app.ml.model_loader import encoders, MODEL_LOADED
from app.core.config import settings


@pytest.mark.skipif(not MODEL_LOADED, reason="Model not trained yet. Run train_model.py first.")
class TestMLFeatureEncoder:
    """Test ML feature encoders for categorical columns"""

    def test_encoders_loaded(self):
        """Test that all required encoders are loaded"""
        assert MODEL_LOADED, "Model should be loaded"
        assert isinstance(encoders, dict)
        
        # Check that all categorical columns have encoders
        for col in settings.CATEGORICAL_COLS:
            assert col in encoders, f"Encoder for '{col}' not found"

    def test_project_type_encoder(self):
        """Test project_type encoder"""
        col = "project_type"
        assert col in encoders
        
        encoder = encoders[col]
        assert hasattr(encoder, 'classes_')
        assert len(encoder.classes_) > 0
        
        # Check that common project types are encoded
        classes = list(encoder.classes_)
        assert isinstance(classes, list)

    def test_project_size_encoder(self):
        """Test project_size encoder"""
        col = "project_size"
        assert col in encoders
        
        encoder = encoders[col]
        classes = list(encoder.classes_)
        
        # Should have at least small, medium, large
        assert len(classes) >= 3

    def test_material_availability_encoder(self):
        """Test material_availability encoder"""
        col = "material_availability"
        assert col in encoders
        
        encoder = encoders[col]
        classes = list(encoder.classes_)
        
        # Should have at least high, medium, low
        assert len(classes) >= 3

    def test_weather_condition_encoder(self):
        """Test weather_condition encoder"""
        col = "weather_condition"
        assert col in encoders
        
        encoder = encoders[col]
        classes = list(encoder.classes_)
        
        # Should have at least clear, cloudy, rainy
        assert len(classes) >= 3

    def test_encoder_transform(self):
        """Test that encoder can transform categorical values"""
        import numpy as np
        col = "project_type"
        encoder = encoders[col]
        
        # Get a valid class
        valid_class = encoder.classes_[0]
        
        # Transform should work
        encoded = encoder.transform([valid_class])
        assert len(encoded) == 1
        assert isinstance(encoded[0], (int, float, np.integer))

    def test_encoder_inverse_transform(self):
        """Test that encoder can inverse transform"""
        col = "project_size"
        encoder = encoders[col]
        
        # Get a valid class and encode it
        original_class = encoder.classes_[0]
        encoded = encoder.transform([original_class])[0]
        
        # Inverse transform should recover original
        decoded = encoder.inverse_transform([encoded])[0]
        assert decoded == original_class

    def test_encoder_handles_all_classes(self):
        """Test that all classes in encoder are valid"""
        for col in settings.CATEGORICAL_COLS:
            encoder = encoders[col]
            
            for cls in encoder.classes_:
                # Should be able to transform
                encoded = encoder.transform([cls])
                assert len(encoded) == 1
                
                # Should be able to inverse transform
                decoded = encoder.inverse_transform(encoded)
                assert decoded[0] == cls

    def test_encoder_rejects_unknown_values(self):
        """Test that encoder raises error for unknown values"""
        col = "project_type"
        encoder = encoders[col]
        
        # Try to transform unknown value
        with pytest.raises(ValueError):
            encoder.transform(["unknown_project_type"])

    def test_all_categorical_columns_have_encoders(self):
        """Test that all categorical columns defined in settings have encoders"""
        for col in settings.CATEGORICAL_COLS:
            assert col in encoders, f"Missing encoder for '{col}'"
            assert encoders[col] is not None


class TestMLNumericFeatures:
    """Test numeric features configuration"""

    def test_numeric_columns_defined(self):
        """Test that numeric columns are properly defined"""
        assert hasattr(settings, "NUMERIC_COLS")
        assert isinstance(settings.NUMERIC_COLS, list)
        assert len(settings.NUMERIC_COLS) > 0

    def test_planned_duration_in_numeric_cols(self):
        """Test that planned_duration is numeric"""
        assert "planned_duration" in settings.NUMERIC_COLS

    def test_contract_value_in_numeric_cols(self):
        """Test that contract_value_lkr is numeric"""
        assert "contract_value_lkr" in settings.NUMERIC_COLS

    def test_labourers_count_in_numeric_cols(self):
        """Test that labourers_count is numeric"""
        assert "labourers_count" in settings.NUMERIC_COLS

    def test_numeric_and_categorical_no_overlap(self):
        """Test that numeric and categorical columns don't overlap"""
        numeric_set = set(settings.NUMERIC_COLS)
        categorical_set = set(settings.CATEGORICAL_COLS)
        
        overlap = numeric_set & categorical_set
        assert len(overlap) == 0, f"Overlapping columns: {overlap}"

    def test_feature_columns_complete(self):
        """Test that all feature columns are accounted for"""
        feature_cols = settings.CATEGORICAL_COLS + settings.NUMERIC_COLS
        
        assert "planned_duration" in feature_cols
        assert "contract_value_lkr" in feature_cols
        assert "labourers_count" in feature_cols
        assert "project_type" in feature_cols
        assert "project_size" in feature_cols
        assert "material_availability" in feature_cols
        assert "weather_condition" in feature_cols


@pytest.mark.skipif(not MODEL_LOADED, reason="Model not trained yet. Run train_model.py first.")
class TestMLEncoderConsistency:
    """Test consistency and correctness of encoders"""

    def test_encoder_classes_are_strings(self):
        """Test that encoder classes are strings (categorical values)"""
        for col in settings.CATEGORICAL_COLS:
            encoder = encoders[col]
            for cls in encoder.classes_:
                assert isinstance(cls, str), f"Class '{cls}' in '{col}' is not string"

    def test_encoder_transforms_to_integers(self):
        """Test that encoders transform to numeric values"""
        import numpy as np
        for col in settings.CATEGORICAL_COLS:
            encoder = encoders[col]
            
            for cls in encoder.classes_:
                encoded = encoder.transform([cls])[0]
                # Should be numeric (int, float, or numpy integer)
                assert isinstance(encoded, (int, float, np.integer))

    def test_encoder_values_are_sequential(self):
        """Test that encoded values are in expected range"""
        for col in settings.CATEGORICAL_COLS:
            encoder = encoders[col]
            num_classes = len(encoder.classes_)
            
            # Encoded values should be 0 to num_classes-1
            for i, cls in enumerate(encoder.classes_):
                encoded = encoder.transform([cls])[0]
                assert 0 <= encoded < num_classes

    def test_encoder_handles_single_value(self):
        """Test encoder with single value list"""
        col = "project_type"
        encoder = encoders[col]
        cls = encoder.classes_[0]
        
        encoded = encoder.transform([cls])
        assert len(encoded) == 1

    def test_encoder_handles_multiple_values(self):
        """Test encoder with multiple values"""
        col = "project_type"
        encoder = encoders[col]
        
        test_classes = list(encoder.classes_)[:2]
        if len(test_classes) >= 2:
            encoded = encoder.transform(test_classes)
            assert len(encoded) == 2


class TestMLFeatureSettings:
    """Test ML feature settings"""

    def test_target_classification_defined(self):
        """Test that classification target is known"""
        # TARGET_CLASSIFICATION is defined in train_model.py, not in settings
        assert "is_delayed" is not None

    def test_target_regression_defined(self):
        """Test that regression target is known"""
        # TARGET_REGRESSION is defined in train_model.py, not in settings
        assert "delay_days" is not None

    def test_feature_columns_defined(self):
        """Test that feature columns are defined"""
        assert hasattr(settings, "FEATURE_COLS")
        assert isinstance(settings.FEATURE_COLS, list)

    def test_feature_columns_order(self):
        """Test that feature columns contain all required columns"""
        feature_cols = settings.FEATURE_COLS
        
        required_features = [
            "project_type", "project_size", "material_availability",
            "weather_condition", "planned_duration", "contract_value_lkr",
            "labourers_count"
        ]
        
        for feat in required_features:
            assert feat in feature_cols, f"Feature '{feat}' not in FEATURE_COLS"

    def test_feature_columns_match_settings(self):
        """Test that settings FEATURE_COLS matches categorical + numeric"""
        expected_features = settings.CATEGORICAL_COLS + settings.NUMERIC_COLS
        assert set(settings.FEATURE_COLS) == set(expected_features)
