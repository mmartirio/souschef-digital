import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict

from fastapi import HTTPException, status


class LoginRateLimiter:
    """Bloqueia a conta/IP depois de muitas senhas erradas em pouco tempo (contra força bruta)."""

    def __init__(self, max_failures: int = 5, window_seconds: int = 15 * 60):
        self.max_failures = max_failures
        self.window = window_seconds
        self._failures: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _recent(self, key: str) -> Deque[float]:
        failures = self._failures[key]
        while failures and failures[0] < time.monotonic() - self.window:
            failures.popleft()
        return failures

    def check(self, *keys: str) -> None:
        with self._lock:
            if any(len(self._recent(key)) >= self.max_failures for key in keys):
                raise HTTPException(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Muitas tentativas de login. Tente novamente em alguns minutos.",
                )

    def fail(self, *keys: str) -> None:
        with self._lock:
            for key in keys:
                self._recent(key).append(time.monotonic())

    def success(self, *keys: str) -> None:
        with self._lock:
            for key in keys:
                self._failures.pop(key, None)


login_limiter = LoginRateLimiter()
