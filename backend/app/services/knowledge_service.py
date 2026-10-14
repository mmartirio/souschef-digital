"""Base de conhecimento "ensinável" do agente (RAG leve por palavras-chave).

Para ensinar o agente, adicione itens em app/knowledge/*.json:
    {"topic": "...", "keywords": ["...", "..."], "content": "..."}
Os arquivos são recarregados automaticamente quando modificados.
"""
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import List, Set

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"
STOPWORDS = {
    "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "um", "uma",
    "para", "por", "com", "que", "como", "qual", "quais", "eu", "meu", "minha", "posso", "pode",
    "fazer", "tem", "ter", "ser", "mais", "muito", "se", "ao", "me", "voce",
}


def tokenize(text: str) -> Set[str]:
    normalized = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode()
    return {w for w in re.findall(r"[a-z0-9]+", normalized) if len(w) > 2 and w not in STOPWORDS}


@dataclass(frozen=True)
class Entry:
    topic: str
    content: str
    terms: frozenset


class KnowledgeService:
    def __init__(self, directory: Path = KNOWLEDGE_DIR):
        self.directory = directory
        self._entries: List[Entry] = []
        self._signature: tuple = ()

    def _reload_if_changed(self) -> None:
        files = sorted(self.directory.glob("*.json"))
        signature = tuple((f.name, f.stat().st_mtime) for f in files)
        if signature == self._signature:
            return
        entries = []
        for file in files:
            for item in json.loads(file.read_text(encoding="utf-8")):
                terms = tokenize(" ".join([item["topic"], *item.get("keywords", [])]))
                entries.append(Entry(item["topic"], item["content"], frozenset(terms)))
        self._entries, self._signature = entries, signature

    def search(self, query: str, limit: int = 3) -> List[Entry]:
        self._reload_if_changed()
        words = tokenize(query)
        scored = [(len(words & e.terms), e) for e in self._entries]
        return [e for score, e in sorted(scored, key=lambda s: -s[0]) if score > 0][:limit]


knowledge_service = KnowledgeService()
