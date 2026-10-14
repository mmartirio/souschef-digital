from fastapi import HTTPException, UploadFile, status

CHUNK_BYTES = 64 * 1024


async def read_limited(file: UploadFile, max_bytes: int, too_large_message: str) -> bytes:
    """Lê o upload em partes e interrompe assim que passar do limite (não carrega arquivos enormes)."""
    chunks, total = [], 0
    while chunk := await file.read(CHUNK_BYTES):
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, too_large_message)
        chunks.append(chunk)
    return b"".join(chunks)
