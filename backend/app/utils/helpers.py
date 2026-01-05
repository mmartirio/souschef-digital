import re
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

def validate_email(email: str) -> bool:
    """
    Valida formato de email.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password(password: str) -> tuple[bool, str]:
    """
    Valida força da senha.
    Retorna (is_valid, message).
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit"
    
    return True, "Password is strong"

def remove_none_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove chaves com valores None de um dicionário.
    """
    return {k: v for k, v in data.items() if v is not None}

def format_error_message(error: Exception) -> str:
    """
    Formata mensagem de erro para resposta da API.
    """
    return str(error).replace("\n", " ").strip()

def calculate_total_time(prep_time: Optional[int], cook_time: Optional[int]) -> Optional[int]:
    """
    Calcula tempo total de uma receita (preparo + cozimento).
    """
    if prep_time is None and cook_time is None:
        return None
    
    prep = prep_time or 0
    cook = cook_time or 0
    return prep + cook

def format_time_display(minutes: Optional[int]) -> str:
    """
    Formata tempo em minutos para exibição amigável.
    Ex: 90 minutos -> "1h 30min"
    """
    if minutes is None or minutes == 0:
        return "N/A"
    
    if minutes < 60:
        return f"{minutes}min"
    
    hours = minutes // 60
    remaining_minutes = minutes % 60
    
    if remaining_minutes == 0:
        return f"{hours}h"
    
    return f"{hours}h {remaining_minutes}min"

def sanitize_string(text: str) -> str:
    """
    Remove caracteres especiais e espaços extras de uma string.
    """
    # Remove múltiplos espaços
    text = re.sub(r'\s+', ' ', text)
    # Remove espaços no início e fim
    text = text.strip()
    return text

def paginate_list(items: List[Any], page: int = 1, page_size: int = 10) -> Dict[str, Any]:
    """
    Pagina uma lista de itens.
    
    Returns:
        Dict com items, total, page, page_size, total_pages
    """
    total = len(items)
    total_pages = (total + page_size - 1) // page_size
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    paginated_items = items[start_idx:end_idx]
    
    return {
        "items": paginated_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

def generate_slug(text: str) -> str:
    """
    Gera um slug a partir de um texto.
    Ex: "Bolo de Chocolate" -> "bolo-de-chocolate"
    """
    # Converte para minúsculas
    text = text.lower()
    # Remove acentos (substitui caracteres acentuados)
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'[ç]', 'c', text)
    # Remove caracteres especiais
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    # Substitui espaços por hífens
    text = re.sub(r'\s+', '-', text)
    # Remove hífens múltiplos
    text = re.sub(r'-+', '-', text)
    # Remove hífens no início e fim
    text = text.strip('-')
    return text

def is_valid_difficulty(difficulty: str) -> bool:
    """
    Valida se o nível de dificuldade é válido.
    """
    valid_difficulties = ['easy', 'medium', 'hard']
    return difficulty.lower() in valid_difficulties

def format_ingredients_list(ingredients: List[Dict[str, str]]) -> str:
    """
    Formata lista de ingredientes para exibição.
    """
    if not ingredients:
        return "No ingredients"
    
    formatted = []
    for ing in ingredients:
        name = ing.get('name', '')
        quantity = ing.get('quantity', '')
        if quantity:
            formatted.append(f"- {quantity} {name}")
        else:
            formatted.append(f"- {name}")
    
    return "\n".join(formatted)