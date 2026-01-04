from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import httpx
import json
import tempfile
import os
import whisper

from app.database.connection import get_db
from app.models.user import User
from app.models.recipe import Recipe
from app.routes.auth import get_current_user
from app.services.ollama_service import ollama_service

router = APIRouter()

# Carregar modelo Whisper (usando modelo base)
try:
    whisper_model = whisper.load_model("base")
    print("✓ Modelo Whisper carregado com sucesso")
except Exception as e:
    print(f"⚠ Erro ao carregar Whisper: {e}")
    whisper_model = None

# Modelos Pydantic
class AIRequest(BaseModel):
    prompt: str
    context: Optional[str] = ""
    model: Optional[str] = "llama2"

class AIResponse(BaseModel):
    response: str
    model: str

class RecipeSuggestionRequest(BaseModel):
    ingredients: List[str]
    dietary_restrictions: Optional[List[str]] = []
    cuisine_type: Optional[str] = None
    difficulty: Optional[str] = None

class ConversationMessage(BaseModel):
    role: str  # "user" ou "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ConversationMessage]
    model: Optional[str] = "llama2"

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: float

# Endpoints
@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Transcreve áudio para texto usando Whisper.
    """
    if not whisper_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de transcrição não disponível. Modelo Whisper não carregado."
        )
    
    # Validar tipo de arquivo
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo deve ser de áudio"
        )
    
    try:
        # Salvar arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Transcrever usando Whisper
        result = whisper_model.transcribe(
            temp_file_path,
            language="pt",  # Português
            fp16=False  # Compatibilidade CPU
        )
        
        # Remover arquivo temporário
        os.unlink(temp_file_path)
        
        return TranscriptionResponse(
            text=result["text"].strip(),
            language=result.get("language", "pt"),
            duration=result.get("duration", 0.0)
        )
        
    except Exception as e:
        # Limpar arquivo temporário em caso de erro
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao transcrever áudio: {str(e)}"
        )

@router.post("/generate", response_model=AIResponse)
async def generate_text(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Gera texto usando o modelo Ollama.
    """
    try:
        # Combina contexto com prompt se fornecido
        full_prompt = request.prompt
        if request.context:
            full_prompt = f"Contexto: {request.context}\\n\\nPergunta: {request.prompt}"
        
        # Chama serviço Ollama
        result = await ollama_service.generate(
            prompt=full_prompt,
            model=request.model
        )
        
        return {
            "response": result.get("response", ""),
            "model": request.model
        }
    
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Ollama service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating response: {str(e)}"
        )

@router.post("/chat", response_model=AIResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Mantém uma conversa com o modelo de IA.
    """
    try:
        # Monta o contexto da conversa
        conversation = "\\n".join([
            f"{msg.role}: {msg.content}" 
            for msg in request.messages
        ])
        
        # Adiciona instrução do sistema
        system_prompt = """Você é um assistente culinário especializado. 
Ajude o usuário com receitas, técnicas de cozinha, substituições de ingredientes, 
e dicas culinárias. Seja preciso, útil e amigável."""
        
        full_prompt = f"{system_prompt}\\n\\n{conversation}\\nassistant:"
        
        result = await ollama_service.generate(
            prompt=full_prompt,
            model=request.model
        )
        
        return {
            "response": result.get("response", ""),
            "model": request.model
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in chat: {str(e)}"
        )

@router.post("/suggest-recipe")
async def suggest_recipe(
    request: RecipeSuggestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sugere uma receita baseada nos ingredientes e preferências fornecidas.
    """
    try:
        # Monta o prompt para sugestão de receita
        ingredients_str = ", ".join(request.ingredients)
        
        prompt = f"""Sugira uma receita detalhada usando os seguintes ingredientes: {ingredients_str}.
        
"""
        
        if request.dietary_restrictions:
            restrictions_str = ", ".join(request.dietary_restrictions)
            prompt += f"Restrições alimentares: {restrictions_str}.\\n"
        
        if request.cuisine_type:
            prompt += f"Tipo de culinária: {request.cuisine_type}.\\n"
        
        if request.difficulty:
            prompt += f"Nível de dificuldade desejado: {request.difficulty}.\\n"
        
        prompt += """
Forneça:
1. Nome da receita
2. Tempo de preparo e cozimento
3. Lista completa de ingredientes com quantidades
4. Instruções passo a passo
5. Dicas extras
"""
        
        result = await ollama_service.generate(prompt=prompt)
        
        return {
            "suggestion": result.get("response", ""),
            "ingredients_used": request.ingredients
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating recipe suggestion: {str(e)}"
        )

@router.post("/analyze-recipe/{recipe_id}")
async def analyze_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analisa uma receita e fornece sugestões de melhoria.
    """
    # Busca receita
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if recipe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    try:
        # Monta informações da receita
        ingredients_str = ", ".join([ing.name for ing in recipe.ingredients])
        
        prompt = f"""Analise a seguinte receita e forneça sugestões de melhoria:

Título: {recipe.title}
Ingredientes: {ingredients_str}
Instruções: {recipe.instructions}
Dificuldade: {recipe.difficulty or 'Não especificada'}

Forneça:
1. Análise nutricional básica
2. Sugestões de substituições de ingredientes
3. Dicas para melhorar o sabor
4. Variações possíveis
5. Harmonização com bebidas
"""
        
        result = await ollama_service.generate(prompt=prompt)
        
        return {
            "recipe_id": recipe_id,
            "recipe_title": recipe.title,
            "analysis": result.get("response", "")
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing recipe: {str(e)}"
        )

@router.post("/substitute-ingredient")
async def substitute_ingredient(
    ingredient: str,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Sugere substituições para um ingrediente.
    """
    try:
        prompt = f"Quais são boas substituições para {ingredient} em uma receita?"
        
        if reason:
            prompt += f" Motivo: {reason}."
        
        prompt += " Liste pelo menos 3 alternativas com explicações breves."
        
        result = await ollama_service.generate(prompt=prompt)
        
        return {
            "ingredient": ingredient,
            "substitutions": result.get("response", "")
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting substitutions: {str(e)}"
        )

class RecipeStepsResponse(BaseModel):
    recipe_id: int
    recipe_title: str
    steps: List[str]
    total_steps: int

@router.get("/recipes/{recipe_id}/steps", response_model=RecipeStepsResponse)
async def get_recipe_steps(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtém os passos de uma receita de forma estruturada para modo guiado.
    """
    try:
        # Buscar receita no banco
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receita não encontrada"
            )
        
        # Dividir as instruções em passos
        import re
        instructions = recipe.instructions or ""
        
        # Tentar dividir por numeração: "1. ", "2. ", etc.
        step_pattern = r'^\d+\.\s+(.+?)(?=^\d+\.|$)'
        steps = re.findall(step_pattern, instructions, re.MULTILINE | re.DOTALL)
        
        if not steps:
            # Se não encontrar numeração, dividir por pontos finais
            steps = [step.strip() for step in instructions.split('.') if step.strip()]
        
        # Limpar e normalizar passos
        steps = [step.strip() for step in steps]
        steps = [step for step in steps if len(step) > 5]  # Ignorar passos muito curtos
        
        if not steps:
            # Fallback: usar toda a instrução como um único passo
            steps = [instructions] if instructions else ["Instruções não disponíveis"]
        
        return RecipeStepsResponse(
            recipe_id=recipe_id,
            recipe_title=recipe.title,
            steps=steps,
            total_steps=len(steps)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter passos: {str(e)}"
        )

@router.get("/cooking-tips")
async def get_cooking_tips(
    topic: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Retorna dicas de cozinha sobre um tópico específico.
    """
    try:
        if topic:
            prompt = f"Forneça dicas práticas de cozinha sobre: {topic}"
        else:
            prompt = "Forneça 5 dicas gerais de cozinha que todo cozinheiro deveria saber."
        
        result = await ollama_service.generate(prompt=prompt)
        
        return {
            "topic": topic or "Dicas gerais",
            "tips": result.get("response", "")
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting cooking tips: {str(e)}"
        )
