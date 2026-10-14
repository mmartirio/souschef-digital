import os
from dataclasses import dataclass
from typing import Optional

import httpx

TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
VALID_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


@dataclass(frozen=True)
class GoogleIdentity:
    email: str
    name: Optional[str]


class GoogleAuthService:
    """Valida ID tokens do Google Sign-In (endpoint tokeninfo do próprio Google)."""

    def __init__(self):
        # IDs de cliente OAuth aceitos (web, android, ios), separados por vírgula
        self.client_ids = {c.strip() for c in os.getenv("GOOGLE_CLIENT_IDS", "").split(",") if c.strip()}

    @property
    def enabled(self) -> bool:
        return bool(self.client_ids)

    async def verify(self, id_token: str) -> Optional[GoogleIdentity]:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(TOKENINFO_URL, params={"id_token": id_token})
        if response.status_code != 200:
            return None
        claims = response.json()
        valid = (
            claims.get("aud") in self.client_ids
            and claims.get("iss") in VALID_ISSUERS
            and claims.get("email_verified") in (True, "true")
        )
        return GoogleIdentity(email=claims["email"], name=claims.get("name")) if valid else None


google_auth_service = GoogleAuthService()
