#!/usr/bin/env python3
"""
Script de teste para o endpoint de transcrição de áudio
"""

import requests
import sys
from pathlib import Path

# Configurações
BASE_URL = "http://localhost:8000"
TEST_AUDIO_FILE = "test_audio.wav"

def test_transcription():
    """Testa o endpoint de transcrição"""
    
    print("🎙️  Testando endpoint de transcrição de áudio...")
    print(f"URL: {BASE_URL}/api/ai/transcribe")
    print()
    
    # Verificar se o arquivo de teste existe
    if not Path(TEST_AUDIO_FILE).exists():
        print("⚠️  Arquivo de áudio de teste não encontrado.")
        print("📝 Você pode criar um arquivo de áudio ou gravar um pelo app.")
        print()
        return False
    
    try:
        # Fazer upload do arquivo
        with open(TEST_AUDIO_FILE, 'rb') as audio_file:
            files = {'audio': (TEST_AUDIO_FILE, audio_file, 'audio/wav')}
            
            print("📤 Enviando áudio para transcrição...")
            response = requests.post(
                f"{BASE_URL}/api/ai/transcribe",
                files=files,
                timeout=30
            )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Transcrição bem-sucedida!")
            print()
            print(f"📝 Texto: {data['text']}")
            print(f"🌐 Idioma: {data['language']}")
            print(f"⏱️  Duração: {data['duration']:.2f}s")
            return True
        else:
            print(f"❌ Erro: {response.status_code}")
            print(f"Detalhes: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Não foi possível conectar ao servidor.")
        print("💡 Certifique-se de que o backend está rodando:")
        print("   cd backend && ./start_server.sh")
        return False
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_server_health():
    """Verifica se o servidor está rodando"""
    
    print("🏥 Verificando saúde do servidor...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor está rodando!")
            print(f"📚 Documentação disponível em: {BASE_URL}/docs")
            print()
            return True
        else:
            print(f"⚠️  Servidor respondeu com status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Servidor não está rodando.")
        print("💡 Inicie o servidor com:")
        print("   cd backend && ./start_server.sh")
        return False
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def main():
    """Função principal"""
    
    print("=" * 50)
    print("  TESTE DE ASSISTENTE DE VOZ - SOUSCHEF BACKEND")
    print("=" * 50)
    print()
    
    # Verificar servidor
    if not test_server_health():
        sys.exit(1)
    
    # Testar transcrição
    success = test_transcription()
    
    print()
    print("=" * 50)
    
    if success:
        print("✅ Todos os testes passaram!")
        print()
        print("🚀 Próximos passos:")
        print("   1. Configure o Ollama: ollama serve")
        print("   2. Baixe um modelo: ollama pull llama2")
        print("   3. Teste o app mobile")
    else:
        print("❌ Alguns testes falharam.")
        print()
        print("💡 Dicas:")
        print("   - Certifique-se de que o backend está rodando")
        print("   - Verifique os logs do servidor")
        print("   - Teste criar um áudio pelo app mobile")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
