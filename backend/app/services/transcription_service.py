import os
import threading

from app.schemas import Transcription

# Contexto passado ao Whisper: aumenta o acerto de termos de cozinha e dos comandos de voz.
VOCABULARY_PROMPT = (
    "Conversa em português com o SousChef, assistente de culinária, sobre receitas, "
    "ingredientes e modo de preparo: xícara, colher de sopa, colher de chá, gramas, "
    "forno, panela, frigideira, refogar, assar, fritar, temperar, leite condensado, "
    "fermento, farinha de trigo, brigadeiro, feijoada, baião de dois, strogonoff, "
    "hambúrguer, bolo. Comandos: próximo, anterior, repetir, sair, tchau."
)


class TranscriptionService:
    """Speech-to-text com faster-whisper. O modelo é carregado no primeiro uso.

    O áudio é decodificado via PyAV (incluso no faster-whisper), então aceita
    m4a/3gp/webm/wav sem ffmpeg instalado no sistema.
    """

    def __init__(self):
        self.model_size = os.getenv("WHISPER_MODEL", "small")
        self.language = os.getenv("WHISPER_LANGUAGE", "pt")
        self.beam_size = int(os.getenv("WHISPER_BEAM_SIZE", "1"))
        self._model = None
        self._lock = threading.Lock()

    @property
    def available(self) -> bool:
        try:
            import faster_whisper  # noqa: F401
            return True
        except ImportError:
            return False

    def _get_model(self):
        with self._lock:
            if self._model is None:
                from faster_whisper import WhisperModel
                self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            return self._model

    def warm_up(self) -> None:
        if self.available:
            self._get_model()

    def transcribe(self, path: str) -> Transcription:
        segments, info = self._get_model().transcribe(
            path,
            language=self.language,
            beam_size=self.beam_size,
            initial_prompt=VOCABULARY_PROMPT,
            vad_filter=True,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return Transcription(text=text, language=info.language, duration=info.duration)


transcription_service = TranscriptionService()
