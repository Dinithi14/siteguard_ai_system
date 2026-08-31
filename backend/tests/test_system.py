"""
System tests - API health, authentication, and security features
Run with: pytest tests/test_system.py -v
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.secuirity import (
    hash_password,
    verify_password,
    create_access_token,
    generate_temp_password,
)
from app.core.config import settings
from jose import jwt

client = TestClient(app)


class TestAPIRoot:
    """Test basic API health and root endpoints"""

    def test_api_root_status(self):
        """Test that API root endpoint returns 200 status"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "SiteGuard AI backend running" in data["status"]

    def test_api_root_response_format(self):
        """Test that root endpoint response has expected format"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)


class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_password_hashing(self):
        """Test that passwords are hashed correctly"""
        password = "TestPassword123!"
        hashed = hash_password(password)
        
        # Hashed password should not be plaintext
        assert hashed != password
        # Hashed password should not be empty
        assert len(hashed) > 0
        # Hashed password should be a string
        assert isinstance(hashed, str)

    def test_password_verification_success(self):
        """Test that correct password verifies"""
        password = "SecurePassword456!"
        hashed = hash_password(password)
        
        is_valid = verify_password(password, hashed)
        assert is_valid is True

    def test_password_verification_failure(self):
        """Test that incorrect password fails verification"""
        password = "CorrectPassword123"
        wrong_password = "WrongPassword456"
        hashed = hash_password(password)
        
        is_valid = verify_password(wrong_password, hashed)
        assert is_valid is False

    def test_password_hashing_consistency(self):
        """Test that same password produces different hashes"""
        password = "TestPassword789"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        # Different hashes (due to salt)
        assert hash1 != hash2
        # But both verify against same password
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_password_case_sensitivity(self):
        """Test that password verification is case-sensitive"""
        password = "CaseSensitive123"
        hashed = hash_password(password)
        
        # Exact password should verify
        assert verify_password(password, hashed)
        # Different case should fail
        assert not verify_password(password.lower(), hashed)


class TestJWTTokenGeneration:
    """Test JWT token generation and validation"""

    def test_jwt_token_generation(self):
        """Test that JWT token is generated correctly"""
        user_id = 1
        role = "supervisor"
        token = create_access_token(user_id, role)
        
        # Token should be a string
        assert isinstance(token, str)
        # Token should not be empty
        assert len(token) > 0
        # Token should have JWT format (3 parts separated by dots)
        assert token.count(".") == 2

    def test_jwt_token_payload(self):
        """Test that JWT token contains correct payload"""
        user_id = 42
        role = "admin"
        token = create_access_token(user_id, role)
        
        # Decode token without verification to check payload
        payload = jwt.get_unverified_claims(token)
        
        assert payload["sub"] == str(user_id)
        assert payload["role"] == role
        assert "exp" in payload

    def test_jwt_token_expiration(self):
        """Test that JWT token has expiration"""
        user_id = 5
        token = create_access_token(user_id, None)
        payload = jwt.get_unverified_claims(token)
        
        assert "exp" in payload
        # Expiration should be a valid timestamp
        assert isinstance(payload["exp"], (int, float))
        assert payload["exp"] > 0

    def test_jwt_token_different_users(self):
        """Test that different users get different tokens"""
        token1 = create_access_token(1, "user")
        token2 = create_access_token(2, "user")
        
        # Tokens should be different
        assert token1 != token2
        
        # But contain different user IDs
        payload1 = jwt.get_unverified_claims(token1)
        payload2 = jwt.get_unverified_claims(token2)
        assert payload1["sub"] != payload2["sub"]

    def test_jwt_token_with_null_role(self):
        """Test that JWT token can be created with null role"""
        token = create_access_token(10, None)
        payload = jwt.get_unverified_claims(token)
        
        assert payload["role"] is None
        assert payload["sub"] == "10"

    def test_jwt_token_signature(self):
        """Test that JWT token is properly signed"""
        token = create_access_token(1, "user")
        
        # Token should verify with correct secret
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            assert payload["sub"] == "1"
        except Exception as e:
            pytest.fail(f"Token verification failed: {e}")


class TestTemporaryPasswordGeneration:
    """Test temporary password generation"""

    def test_temp_password_generation(self):
        """Test that temporary password is generated"""
        temp_pwd = generate_temp_password()
        
        assert isinstance(temp_pwd, str)
        assert len(temp_pwd) == 12  # Default length
        assert len(temp_pwd) > 0

    def test_temp_password_length(self):
        """Test that temporary password respects specified length"""
        for length in [8, 12, 16, 20]:
            temp_pwd = generate_temp_password(length=length)
            assert len(temp_pwd) == length

    def test_temp_password_complexity(self):
        """Test that temporary password contains mixed case and digits"""
        temp_pwd = generate_temp_password()
        
        has_lower = any(c.islower() for c in temp_pwd)
        has_upper = any(c.isupper() for c in temp_pwd)
        has_digit = any(c.isdigit() for c in temp_pwd)
        
        assert has_lower, "Password should contain lowercase letters"
        assert has_upper, "Password should contain uppercase letters"
        assert has_digit, "Password should contain digits"

    def test_temp_password_uniqueness(self):
        """Test that generated temporary passwords are unique"""
        passwords = [generate_temp_password() for _ in range(10)]
        
        # All passwords should be unique
        assert len(passwords) == len(set(passwords))
