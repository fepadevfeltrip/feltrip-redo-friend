# Guia Completo: Infraestrutura AWS para Boba Professora

## Visão Geral da Arquitetura

A Culti Professora usa uma arquitetura serverless com:
- **API Gateway WebSocket** - Comunicação bidirecional em tempo real
- **Lambda Functions** - Processamento de mensagens, transcrição e chat
- **S3** - Armazenamento de áudios (opcional)
- **DynamoDB** - Gerenciamento de conexões WebSocket
- **AWS Bedrock** - Claude 3 Haiku para chat e Amazon Transcribe para áudio

---

## ⚠️ IMPORTANTE: Lambda Proxy Integration

**Em TODAS as integrações entre API Gateway e Lambda Functions, você DEVE ativar o "Lambda Proxy integration"!**

O que isso significa:
- **WebSocket API**: Ao criar as rotas `$connect`, `$disconnect` e `sendmessage`, marque a opção "Use Lambda Proxy integration"
- **REST API**: Ao criar o método POST para `/transcribe`, marque a opção "Use Lambda Proxy integration"

Por que é necessário:
- Permite que o Lambda receba o evento completo da API Gateway (headers, body, context)
- Permite que o Lambda retorne respostas formatadas corretamente
- Sem isso, a comunicação entre API Gateway e Lambda não funcionará corretamente

---

## PASSO 1: Criar Tabela DynamoDB para Conexões

### 1.1 No Console AWS, vá para DynamoDB
1. Acesse: https://console.aws.amazon.com/dynamodb
2. Clique em **"Criar tabela"**

### 1.2 Configurar a Tabela
- **Nome da tabela**: `BobaConnectionsTable`
- **Chave de partição**: `connectionId` (String)
- **Configurações**: Use as padrões (on-demand)
- Clique em **"Criar tabela"**

---

## PASSO 2: Criar Role IAM para as Lambdas

### 2.1 No Console AWS, vá para IAM
1. Acesse: https://console.aws.amazon.com/iam
2. Vá em **Roles** → **Criar role**

### 2.2 Configurar a Role
- **Tipo de entidade confiável**: Serviço da AWS
- **Caso de uso**: Lambda
- Clique em **Próximo**

### 2.3 Adicionar Políticas
Anexe as seguintes políticas:
- `AWSLambdaBasicExecutionRole` (logs do CloudWatch)
- `AmazonDynamoDBFullAccess` (acesso ao DynamoDB)
- `AmazonTranscribeFullAccess` (transcrição de áudio)
- Crie uma política inline para API Gateway e Bedrock:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections",
        "execute-api:Invoke"
      ],
      "Resource": "arn:aws:execute-api:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    }
  ]
}
```

- **Nome da role**: `BobaLambdaExecutionRole`
- Clique em **Criar role**

---

## PASSO 3: Criar Lambda de Conexão WebSocket

### 3.1 Criar a Lambda
1. Acesse: https://console.aws.amazon.com/lambda
2. Clique em **Criar função**
3. **Nome**: `BobaWebSocketConnect`
4. **Runtime**: Python 3.12
5. **Permissões**: Use a role `BobaLambdaExecutionRole`
6. Clique em **Criar função**

### 3.2 Código da Lambda (Connect)
```python
import json
import boto3
import time

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('BobaConnectionsTable')

def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    
    table.put_item(
        Item={
            'connectionId': connection_id,
            'timestamp': int(time.time() * 1000)
        }
    )
    
    return {
        'statusCode': 200,
        'body': 'Connected'
    }
```

### 3.3 Configurar
- **Timeout**: 10 segundos
- **Variáveis de ambiente**: (nenhuma necessária ainda)

---

## PASSO 4: Criar Lambda de Desconexão WebSocket

### 4.1 Criar a Lambda
- **Nome**: `BobaWebSocketDisconnect`
- **Runtime**: Python 3.12
- **Role**: `BobaLambdaExecutionRole`

### 4.2 Código da Lambda (Disconnect)
```python
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('BobaConnectionsTable')

def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    
    table.delete_item(
        Key={
            'connectionId': connection_id
        }
    )
    
    return {
        'statusCode': 200,
        'body': 'Disconnected'
    }
```

---

## PASSO 5: Criar Lambda Principal de Mensagens

### 5.1 Criar a Lambda
- **Nome**: `BobaProfessoraProcessor`
- **Runtime**: Python 3.12
- **Role**: `BobaLambdaExecutionRole`
- **Timeout**: 30 segundos
- **Memória**: 512 MB

### 5.2 Adicionar Variáveis de Ambiente
- `DYNAMODB_TABLE`: `BobaConnectionsTable`
- Não precisa de API keys! Bedrock usa IAM permissions

### 5.3 Código da Lambda (Mensagens)
```python
import json
import boto3
import os
import base64

# Clientes AWS
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
polly_client = boto3.client('polly', region_name='us-east-1')

def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    domain = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    
    # Configurar endpoint do API Gateway
    endpoint_url = f"https://{domain}/{stage}"
    apigw = boto3.client('apigatewaymanagementapi', endpoint_url=endpoint_url)
    
    try:
        body = json.loads(event['body'])
        user_text = body.get('user_text', '')
        user_language = body.get('user_language', 'Português')
        learning_language = body.get('learning_language', 'English')
        
        # Construir prompt bilíngue
        system_prompt = f"""Você é a Boba Professora, uma assistente de idiomas amigável.
O usuário fala {user_language} e quer aprender {learning_language}.
REGRAS:
1. Responda SEMPRE em {user_language} primeiro
2. Depois repita a mesma frase em {learning_language}
3. Use emojis e seja encorajadora
4. Corrija erros gentilmente

Exemplo:
Usuário: "Como se diz 'bom dia'?"
Você: "Em inglês dizemos 'Good morning'! ☀️
Good morning! (Bom dia!)"
"""
        
        # Chamar Claude 3 Haiku via Bedrock
        bedrock_body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [
                {
                    "role": "user",
                    "content": f"{system_prompt}\n\nUsuário: {user_text}"
                }
            ]
        })
        
        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=bedrock_body
        )
        
        response_body = json.loads(response['body'].read())
        assistant_text = response_body['content'][0]['text']
        
        # Gerar áudio com Amazon Polly
        # Detectar idioma para voz adequada
        voice_id = 'Camila' if user_language == 'Português' else 'Joanna'
        
        polly_response = polly_client.synthesize_speech(
            Text=assistant_text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            Engine='neural'
        )
        
        # Converter áudio para base64
        audio_bytes = polly_response['AudioStream'].read()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Enviar resposta via WebSocket
        response_data = {
            'response': assistant_text,
            'audio_base64': audio_base64
        }
        
        apigw.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(response_data).encode('utf-8')
        )
        
        return {
            'statusCode': 200,
            'body': 'Message processed'
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        
        try:
            error_data = {'error': str(e)}
            apigw.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(error_data).encode('utf-8')
            )
        except Exception as send_error:
            print(f"Failed to send error: {str(send_error)}")
        
        return {
            'statusCode': 500,
            'body': 'Error'
        }
```

### 5.4 Configuração Adicional
**Não precisa de Layer!** boto3 já vem instalado no Lambda Python por padrão.

**Importante**: Ative o Claude 3 Haiku no Bedrock:
1. Vá em: https://console.aws.amazon.com/bedrock
2. **Model access** (menu lateral)
3. **Manage model access**
4. Marque **Anthropic Claude 3 Haiku**
5. Clique em **Request model access**

---

## PASSO 6: Criar Lambda de Transcrição de Áudio

### 6.1 Criar a Lambda
- **Nome**: `BobaAudioTranscribe`
- **Runtime**: Python 3.12
- **Role**: `BobaLambdaExecutionRole`
- **Timeout**: 30 segundos
- **Memória**: 512 MB

### 6.2 Variáveis de Ambiente
Nenhuma necessária! Usa IAM permissions

### 6.3 Código da Lambda (Transcrição)
```python
import json
import boto3
import base64
import uuid
from datetime import datetime

s3_client = boto3.client('s3', region_name='us-east-1')
transcribe_client = boto3.client('transcribe', region_name='us-east-1')

# Crie um bucket S3 chamado 'boba-audio-temp-{sua-account-id}'
BUCKET_NAME = 'boba-audio-temp'  # Você vai criar no próximo passo

def lambda_handler(event, context):
    try:
        # Receber áudio (base64 ou binary)
        if event.get('isBase64Encoded', False):
            audio_data = base64.b64decode(event['body'])
        else:
            audio_data = event['body'].encode('utf-8')
        
        # Upload temporário para S3
        file_key = f"audio/{uuid.uuid4()}.wav"
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=file_key,
            Body=audio_data,
            ContentType='audio/wav'
        )
        
        # Iniciar job de transcrição
        job_name = f"transcribe-{uuid.uuid4()}"
        language_code = event.get('headers', {}).get('x-language', 'pt-BR')
        
        # Mapear para códigos do Transcribe
        language_map = {
            'pt': 'pt-BR',
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR'
        }
        language_code = language_map.get(language_code, 'pt-BR')
        
        transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': f's3://{BUCKET_NAME}/{file_key}'},
            MediaFormat='wav',
            LanguageCode=language_code
        )
        
        # Aguardar conclusão (polling)
        max_attempts = 60
        for attempt in range(max_attempts):
            status = transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )
            
            job_status = status['TranscriptionJob']['TranscriptionJobStatus']
            
            if job_status == 'COMPLETED':
                transcript_uri = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
                
                # Buscar resultado
                import urllib.request
                with urllib.request.urlopen(transcript_uri) as response:
                    transcript_data = json.loads(response.read())
                
                text = transcript_data['results']['transcripts'][0]['transcript']
                
                # Limpar S3
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_key)
                transcribe_client.delete_transcription_job(TranscriptionJobName=job_name)
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'text': text})
                }
            
            elif job_status == 'FAILED':
                raise Exception('Transcription job failed')
            
            # Aguardar 1 segundo
            import time
            time.sleep(1)
        
        raise Exception('Transcription timeout')
        
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        
        # Limpar em caso de erro
        try:
            s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_key)
        except:
            pass
        
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }
```

### 6.4 Criar Bucket S3 para Áudio Temporário
1. Vá em: https://console.aws.amazon.com/s3
2. **Criar bucket**
3. **Nome**: `boba-audio-temp-{sua-account-id}` (substitua pelo seu account ID)
4. **Região**: us-east-1
5. **Configurações**: Padrão (privado)
6. Clique em **Criar bucket**
7. **Atualize o código da Lambda** com o nome do bucket criado

---

## PASSO 7: Criar API Gateway WebSocket

### 7.1 Criar a API
1. Acesse: https://console.aws.amazon.com/apigateway
2. Clique em **Criar API**
3. Escolha **API WebSocket**
4. **Nome**: `BobaWebSocketAPI`
5. **Expressão de seleção de rota**: `$request.body.action`
6. Clique em **Criar API**

### 7.2 Configurar Rotas
Crie as seguintes rotas:

#### Rota: `$connect`
- **Tipo de integração**: Lambda Function
- **Use Lambda Proxy integration**: ✅ **ATIVAR** (marque esta opção)
- **Lambda**: `BobaWebSocketConnect`
- **Permissão**: Conceder permissão ao API Gateway

#### Rota: `$disconnect`
- **Tipo de integração**: Lambda Function
- **Use Lambda Proxy integration**: ✅ **ATIVAR** (marque esta opção)
- **Lambda**: `BobaWebSocketDisconnect`

#### Rota: `sendmessage`
- **Tipo de integração**: Lambda Function
- **Use Lambda Proxy integration**: ✅ **ATIVAR** (marque esta opção)
- **Lambda**: `BobaProfessoraProcessor`

### 7.3 Deploy da API
1. Clique em **Ações** → **Implantar API**
2. **Estágio**: `production`
3. Clique em **Implantar**
4. **Copie a URL WebSocket**: `wss://XXXXXXX.execute-api.us-east-1.amazonaws.com/production`

---

## PASSO 8: Criar API REST para Transcrição

### 8.1 Criar API REST
1. No API Gateway, clique em **Criar API**
2. Escolha **API REST**
3. **Nome**: `BobaTranscribeAPI`
4. Clique em **Criar**

### 8.2 Criar Recurso `/transcribe`
1. **Ações** → **Criar recurso**
2. **Nome**: `transcribe`
3. Marcar **Ativar CORS**

### 8.3 Criar Método POST
1. Selecione `/transcribe`
2. **Ações** → **Criar método** → **POST**
3. **Tipo de integração**: Lambda Function
4. **Use Lambda Proxy integration**: ✅ **ATIVAR** (marque esta opção)
5. **Lambda**: `BobaAudioTranscribe`
6. **Tipo de conteúdo binário**: `audio/*`
7. Salvar

### 8.4 Configurar CORS
1. **Ações** → **Ativar CORS**
2. Marcar todas as opções
3. Confirmar

### 8.5 Deploy
1. **Ações** → **Implantar API**
2. **Estágio**: `prod`
3. **Copie a URL**: `https://XXXXXXX.execute-api.us-east-1.amazonaws.com/prod`

---

## PASSO 9: Configurar Permissões das Lambdas

Para cada Lambda, adicione permissão para o API Gateway invocar:

```bash
aws lambda add-permission \
  --function-name BobaWebSocketConnect \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com
```

Repita para todas as Lambdas.

---

## PASSO 10: Atualizar o Frontend

### 10.1 URLs no Frontend
Atualize `src/components/app/BobaProfessoraChat.tsx`:

```typescript
const AWS_WEBSOCKET_URL = "wss://XXXXXXX.execute-api.us-east-1.amazonaws.com/production";
const SUPABASE_URL = "https://XXXXXXX.execute-api.us-east-1.amazonaws.com/prod";
```

### 10.2 Estrutura da Mensagem
```typescript
{
  action: "sendmessage",
  user_text: "texto do usuário",
  user_language: "Português",
  learning_language: "English"
}
```

---

## RESUMO DOS RECURSOS CRIADOS

| Recurso | Nome | Função |
|---------|------|--------|
| DynamoDB | BobaConnectionsTable | Gerencia conexões ativas |
| Lambda | BobaWebSocketConnect | Registra novas conexões |
| Lambda | BobaWebSocketDisconnect | Remove conexões |
| Lambda | BobaProfessoraProcessor | Processa chat e gera respostas |
| Lambda | BobaAudioTranscribe | Transcreve áudio para texto |
| API Gateway (WS) | BobaWebSocketAPI | WebSocket para chat em tempo real |
| API Gateway (REST) | BobaTranscribeAPI | Upload de áudio |
| IAM Role | BobaLambdaExecutionRole | Permissões para Lambdas |

---

## CUSTOS ESTIMADOS (uso moderado)

- **Lambda**: ~$0.20/mês (1M invocações incluídas no free tier)
- **API Gateway**: ~$1.00/mês (1M mensagens incluídas)
- **DynamoDB**: ~$0.25/mês (25 GB incluídos)
- **AWS Bedrock (Claude 3 Haiku)**:
  - $0.25 por 1M tokens de entrada
  - $1.25 por 1M tokens de saída
  - ~1.000 mensagens ≈ $0.50
- **Amazon Transcribe**: $0.024/minuto (60 minutos free tier)
- **Amazon Polly**: $4.00 por 1M caracteres (5M incluídos no free tier)
- **S3**: ~$0.02/mês (praticamente grátis para áudios temporários)

**Total estimado**: $2-10/mês dependendo do uso (muito mais barato que OpenAI!)

---

## PRÓXIMOS PASSOS

1. ✅ Configurar todos os recursos AWS (siga os passos 1-9)
2. ✅ **IMPORTANTE**: Ativar Claude 3 Haiku no Bedrock (veja passo 5.4)
3. ✅ Criar bucket S3 para áudios temporários (passo 6.4)
4. ✅ Atualizar URLs no frontend (passo 10)
5. 🔄 Testar conexão WebSocket
6. 🔄 Testar transcrição de áudio
7. 🔄 Testar chat bilíngue com Claude
8. 🎯 Adicionar funcionalidades extras (histórico, mais idiomas, etc.)

---

## DÚVIDAS COMUNS

**Q: Preciso de API key da OpenAI?**
A: **NÃO!** Usamos Claude 3 Haiku via AWS Bedrock, que usa permissões IAM. Muito mais seguro e barato!

**Q: Preciso ativar o Claude no Bedrock?**
A: Sim! Vá em Bedrock → Model access → Request access para Claude 3 Haiku (passo 5.4).

**Q: Preciso configurar CORS?**
A: Sim, o CORS já está configurado nos passos do API Gateway REST.

**Q: Como debug as Lambdas?**
A: Use CloudWatch Logs. Cada Lambda gera logs automaticamente.

**Q: Posso usar S3 para áudios permanentes?**
A: Sim! O bucket atual é temporário. Crie outro bucket para armazenar áudios permanentes se quiser.

**Q: Como adicionar mais idiomas?**
A: Apenas adicione mais botões no frontend. Claude e Polly já suportam vários idiomas.

**Q: Claude 3 Haiku é bom para isso?**
A: Sim! É rápido, barato e excelente para conversação educacional.

---

## SUPORTE

Se encontrar erros:
1. Verifique CloudWatch Logs de cada Lambda
2. **Confirme que Claude 3 Haiku está ativado no Bedrock**
3. Verifique permissões IAM (Bedrock, Transcribe, Polly, S3)
4. Teste cada Lambda individualmente no console
5. Confirme que o bucket S3 foi criado corretamente
