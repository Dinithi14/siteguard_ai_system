"""
All MongoDB reads/writes for predictions live here. Services call these
functions instead of touching `predictions_collection` directly.
"""
from app.core.database import predictions_collection


def save_prediction(result: dict) -> None:
    """Non-fatal if MongoDB isn't running - a missing log shouldn't break a prediction response."""
    try:
        predictions_collection.insert_one({**result})
    except Exception as e:
        print(f"WARNING: could not log prediction to MongoDB: {e}")


def get_recent_predictions(limit: int = 10) -> list[dict]:
    try:
        docs = list(
            predictions_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
        )
        return docs
    except Exception as e:
        raise ConnectionError(f"MongoDB not available: {e}")
