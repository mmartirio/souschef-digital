# Assistente de Voz - SousChef Digital

## Funcionalidades Implementadas

O assistente virtual agora possui capacidades de voz em ambas as direções:

### 1. Entrada de Voz (Speech-to-Text)
- **Botão de Microfone**: Localizado no canto esquerdo da área de entrada de texto
- **Gravação de Áudio**: Pressione o botão do microfone para iniciar a gravação
- **Indicador Visual**: O botão fica vermelho durante a gravação
- **Parar Gravação**: Pressione novamente para parar

**Nota**: A conversão de áudio para texto será implementada quando o backend estiver configurado com serviço de reconhecimento de voz.

### 2. Saída de Voz (Text-to-Speech)
- **Botão de Alto-falante**: Aparece ao lado de cada mensagem do assistente
- **Reprodução de Áudio**: Pressione o botão para ouvir a resposta do assistente
- **Idioma**: Configurado para Português do Brasil (pt-BR)
- **Controle de Reprodução**: Pressione novamente para parar a reprodução

## Pacotes Utilizados

### expo-av
- Responsável pela gravação de áudio
- Gerencia permissões de microfone
- Captura áudio em alta qualidade

### expo-speech
- Converte texto em fala
- Suporta múltiplos idiomas
- Controle de velocidade, tom e volume

## Funcionalidades Técnicas

### Permissões
O aplicativo solicita automaticamente permissões de:
- Acesso ao microfone (para gravação)
- Gravação de áudio

### Estados
- `isRecording`: Indica se está gravando áudio
- `isSpeaking`: Indica se está reproduzindo áudio
- `recording`: Objeto de gravação ativo

### Configuração de Áudio
```typescript
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
});
```

## Interface do Usuário

### Botões Adicionados
1. **Microfone** (entrada de texto):
   - Ícone: `mic` / `stop-circle`
   - Cor: Primária / Vermelha (quando ativo)
   - Posição: Esquerda da área de entrada

2. **Alto-falante** (mensagens do assistente):
   - Ícone: `volume-high` / `stop-circle`
   - Cor: Primária
   - Posição: Ao lado da mensagem do assistente

## Próximos Passos

### Backend
Para funcionalidade completa de voz, é necessário:

1. **Configurar serviço de Speech-to-Text**:
   - Google Cloud Speech-to-Text
   - AWS Transcribe
   - Azure Speech Service
   - OpenAI Whisper

2. **Endpoint de Conversão**:
```python
@router.post("/ai/transcribe")
async def transcribe_audio(audio: UploadFile):
    # Processar áudio e retornar texto
    pass
```

3. **Integração com Ollama**:
   - Enviar texto transcrito para o modelo
   - Retornar resposta do assistente
   - Opcionalmente converter resposta em áudio

## Uso

### Para Gravar Voz:
1. Abra o assistente de IA
2. Toque no botão do microfone
3. Fale sua pergunta
4. Toque novamente para parar
5. (Aguardando implementação do backend para enviar a transcrição)

### Para Ouvir Resposta:
1. Receba uma mensagem do assistente
2. Toque no ícone de alto-falante ao lado da mensagem
3. Ouça a resposta
4. Toque novamente para parar a reprodução

## Limitações Atuais

1. **Transcrição de Áudio**: Não implementada (requer backend)
2. **Reconhecimento Offline**: Não disponível
3. **Múltiplos Idiomas**: Apenas Português BR configurado
4. **Processamento de Ruído**: Sem filtro de ruído de fundo

## Melhorias Futuras

- [ ] Implementar transcrição de áudio no backend
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Implementar indicador de forma de onda durante gravação
- [ ] Adicionar filtro de ruído
- [ ] Implementar reconhecimento contínuo de voz
- [ ] Adicionar feedback tátil (vibração)
- [ ] Implementar cache de áudio para respostas recorrentes
- [ ] Adicionar configurações de voz (velocidade, tom)

## Avisos

⚠️ **Aviso de Deprecação**: O pacote `expo-av` está deprecado no SDK 54 do Expo. Considere migrar para:
- `expo-audio` para funcionalidades de áudio
- `expo-video` para funcionalidades de vídeo

## Documentação Adicional

- [Expo Speech Documentation](https://docs.expo.dev/versions/latest/sdk/speech/)
- [Expo AV Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
- [React Native Voice](https://github.com/react-native-voice/voice) (alternativa)
