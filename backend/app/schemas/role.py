from pydantic import BaseModel, Field

from app.models.role import RoleName


class RoleCreateRequest(BaseModel):

    name: RoleName = Field(
        description="Role name. Allowed values: ADMIN or USER.",
        examples=["USER"]
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "USER"
            }
        }
    }


class RoleResponse(BaseModel):

    id: int
    name: RoleName

    model_config = {
        "from_attributes": True
    }