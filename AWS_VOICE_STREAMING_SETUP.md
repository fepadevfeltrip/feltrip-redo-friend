# AWS Voice Streaming Setup Guide

Este guia explica como configurar a infraestrutura AWS necessária para o streaming de voz em tempo real.

## Arquitetura

```
Cliente → Supabase Edge Function (WebSocket Proxy) → AWS Lambda (WebSocket) 
                                                            ↓
                                                   Transcribe Streaming
                                                            ↓
                                                    Bedrock/Claude
                                                            ↓
                                                      Polly Streaming
                                                            ↓
Cliente ← Supabase Edge Function ← AWS Lambda (Audio Response)
```

## Pré-requisitos

1. Conta AWS com acesso ao:
   - API Gateway
   - Lambda
   - Transcribe
   - Bedrock (Claude)
   - Polly
   - IAM

## Passo 1: Criar Lambda Function

### 1.1 - Criar função Lambda
```bash
Nome: BobaVoiceStreaming
Runtime: Python 3.12
Architecture: x86_64
Timeout: 300 segundos (5 minutos)
Memory: 512 MB
```

### 1.2 - Código da Lambda (Python)

```python
import json
import boto3
import asyncio
import base64
from datetime import datetime

transcribe_streaming = boto3.client('transcribe-streaming', region_name='us-east-1')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
polly = boto3.client('polly', region_name='us-east-1')

# Armazena contexto da conversa por connectionId
conversations = {}

def lambda_handler(event, context):
    route_key = event.get('requestContext', {}).get('routeKey')
    connection_id = event.get('requestContext', {}).get('connectionId')
    
    if route_key == '$connect':
        return handle_connect(connection_id)
    elif route_key == '$disconnect':
        return handle_disconnect(connection_id)
    elif route_key == '$default':
        return handle_message(event, connection_id)
    
    return {'statusCode': 400, 'body': 'Invalid route'}

def handle_connect(connection_id):
    print(f"Client connected: {connection_id}")
    conversations[connection_id] = {
        'messages': [],
        'config': {}
    }
    return {'statusCode': 200, 'body': 'Connected'}

def handle_disconnect(connection_id):
    print(f"Client disconnected: {connection_id}")
    if connection_id in conversations:
        del conversations[connection_id]
    return {'statusCode': 200, 'body': 'Disconnected'}

def handle_message(event, connection_id):
    try:
        body = json.loads(event.get('body', '{}'))
        message_type = body.get('type')
        
        if message_type == 'configure':
            # Configuração inicial
            conversations[connection_id]['config'] = {
                'userId': body.get('userId'),
                'nativeLanguage': body.get('nativeLanguage', 'Português'),
                'learningLanguage': body.get('learningLanguage', 'English')
            }
            return {'statusCode': 200, 'body': 'Configured'}
        
        elif message_type == 'audio':
            # Recebeu chunk de áudio do cliente
            return process_audio_chunk(connection_id, body.get('data'))
        
        return {'statusCode': 400, 'body': 'Unknown message type'}
        
    except Exception as e:
        print(f"Error handling message: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}

def process_audio_chunk(connection_id, audio_base64):
    """
    Processa chunk de áudio:
    1. Transcreve com Transcribe Streaming
    2. Envia para Bedrock/Claude
    3. Converte resposta para áudio com Polly
    4. Envia de volta para o cliente
    """
    try:
        # Decodifica áudio
        audio_bytes = base64.b64decode(audio_base64)
        
        # 1. TRANSCRIBE STREAMING
        # Nota: Transcribe Streaming requer implementação mais complexa
        # com async streams. Para simplificar, use Transcribe batch:
        transcribe = boto3.client('transcribe')
        
        # Upload áudio para S3 temporário
        s3 = boto3.client('s3')
        bucket = 'boba-audio-temp-659418876407'
        key = f"streaming/{connection_id}/{datetime.now().timestamp()}.wav"
        s3.put_object(Bucket=bucket, Key=key, Body=audio_bytes)
        
        # Inicia job de transcrição
        job_name = f"job-{connection_id}-{int(datetime.now().timestamp())}"
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': f's3://{bucket}/{key}'},
            MediaFormat='wav',
            LanguageCode='pt-BR',  # Ajuste baseado em config
        )
        
        # Aguarda conclusão
        while True:
            status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
                break
            import time
            time.sleep(0.5)
        
        if status['TranscriptionJob']['TranscriptionJobStatus'] == 'FAILED':
            raise Exception("Transcription failed")
        
        # Obtém texto
        import urllib.request
        transcript_uri = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
        with urllib.request.urlopen(transcript_uri) as response:
            transcript_data = json.loads(response.read())
        
        user_text = transcript_data['results']['transcripts'][0]['transcript']
        
        # 2. BEDROCK/CLAUDE
        config = conversations[connection_id]['config']
        
        # Adiciona mensagem ao histórico
        conversations[connection_id]['messages'].append({
            'role': 'user',
            'content': user_text
        })
        
        # Monta prompt
        system_prompt = f"""Você é a Boba Professora, uma professora de idiomas amigável.
O aluno fala {config['nativeLanguage']} nativamente e está aprendendo {config['learningLanguage']}.
Responda de forma didática, corrigindo erros gentilmente e ensinando novos conceitos."""
        
        messages = conversations[connection_id]['messages']
        
        # Chama Bedrock
        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 1000,
                'system': system_prompt,
                'messages': messages
            })
        )
        
        response_body = json.loads(response['body'].read())
        assistant_text = response_body['content'][0]['text']
        
        # Adiciona resposta ao histórico
        conversations[connection_id]['messages'].append({
            'role': 'assistant',
            'content': assistant_text
        })
        
        # 3. POLLY STREAMING
        # Sintetiza resposta em áudio
        polly_response = polly.synthesize_speech(
            Text=assistant_text,
            OutputFormat='pcm',
            VoiceId='Camila',  # Voz em português brasileiro
            Engine='neural',
            SampleRate='16000'
        )
        
        # Lê áudio
        audio_stream = polly_response['AudioStream'].read()
        audio_base64_response = base64.b64encode(audio_stream).decode('utf-8')
        
        # 4. ENVIA DE VOLTA PARA CLIENTE
        # Nota: Para enviar via WebSocket, você precisará usar o API Gateway Management API
        apigateway_management = boto3.client(
            'apigatewaymanagementapi',
            endpoint_url=f"https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/production"
        )
        
        # Envia transcrição
        apigateway_management.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({
                'type': 'transcript',
                'role': 'user',
                'text': user_text
            })
        )
        
        # Envia resposta texto
        apigateway_management.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({
                'type': 'transcript',
                'role': 'assistant',
                'text': assistant_text
            })
        )
        
        # Envia áudio em chunks (max 32KB por mensagem WebSocket)
        chunk_size = 32000  # 32KB
        for i in range(0, len(audio_base64_response), chunk_size):
            chunk = audio_base64_response[i:i+chunk_size]
            apigateway_management.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps({
                    'type': 'audio',
                    'data': chunk
                })
            )
        
        return {'statusCode': 200, 'body': 'Processed'}
        
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}
```

### 1.3 - IAM Role da Lambda

Adicione estas permissões à role da Lambda:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
        "transcribe:StartStreamTranscription"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::boba-audio-temp-659418876407/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": "arn:aws:execute-api:*:*:*/@connections/*"
    }
  ]
}
```

## Passo 2: Criar API Gateway WebSocket

### 2.1 - Criar API
1. Acesse API Gateway console
2. Crie nova API WebSocket
3. Nome: `BobaVoiceStreamingAPI`

### 2.2 - Configurar Routes
- `$connect` → Lambda: BobaVoiceStreaming
- `$disconnect` → Lambda: BobaVoiceStreaming  
- `$default` → Lambda: BobaVoiceStreaming

### 2.3 - Deploy
1. Crie Stage: `production`
2. Deploy API
3. Anote o WebSocket URL: `wss://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/production`

## Passo 3: Atualizar Edge Function

No arquivo `supabase/functions/aws-voice-streaming/index.ts`, substitua:

```typescript
const AWS_VOICE_STREAMING_URL = "wss://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/production";
```

## Passo 4: Ativar Bedrock Models

1. Acesse Bedrock console
2. Vá em "Model access"
3. Request access para: `Claude 3 Haiku`
4. Aguarde aprovação (geralmente instantâneo)

## Passo 5: Testar

1. Selecione idiomas na interface
2. Clique em "Ligar"
3. Fale naturalmente
4. A IA deve responder em tempo real com áudio

## Troubleshooting

### Lambda timeout
- Aumente timeout para 300 segundos
- Verifique CloudWatch Logs

### Transcribe errors
- Verifique formato de áudio (PCM16, 16kHz, mono)
- Confirme IAM permissions

### Bedrock access denied
- Verifique model access no Bedrock console
- Confirme IAM permissions

### WebSocket disconnects
- API Gateway tem limite de 2h por conexão
- Lambda tem limite de 15 minutos execution time
- Use keep-alive messages

## Otimizações Futuras

1. **Transcribe Streaming real** (mais complexo mas menor latência)
2. **Polly Speech Marks** para sincronizar áudio com texto
3. **DynamoDB** para persistir conversas
4. **CloudFront** para cache de áudio comum
5. **Step Functions** para orquestrar workflow

## Custos Estimados

- Transcribe: $0.024/min
- Bedrock Claude: $0.003/1K tokens input, $0.015/1K tokens output
- Polly: $0.016/1M chars (Neural)
- Lambda: $0.0000166667/GB-s
- API Gateway: $1.00/million messages

Conversa de 10 min ≈ $0.50-1.00
