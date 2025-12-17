from supabase import create_client, Client
import os

class SupabaseService:
    def __init__(self):
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        self.client: Client = create_client(url, key)
    
    def get_client(self) -> Client:
        return self.client

supabase_service = SupabaseService()
