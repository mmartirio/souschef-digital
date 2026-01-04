# Serviço Supabase - Deixado vazio conforme solicitado
# Para implementar futuramente quando necessário

import os

class SupabaseService:
    """
    Serviço para integração com Supabase.
    Implementação futura conforme necessidade.
    """
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "")
        self.key = os.getenv("SUPABASE_KEY", "")
    
    # Adicione métodos aqui quando necessário

# Instância global (opcional)
supabase_service = SupabaseService()
