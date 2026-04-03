import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "npm:@aws-sdk/client-bedrock-agent-runtime"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-auth-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, sessionId, city, lang, mode } = await req.json()

    const client = new BedrockAgentRuntimeClient({
      region: Deno.env.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
      },
    })

    const langLabel = lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : 'Portuguese';

    let inputText: string;

    if (mode === 'final') {
      inputText = `[SISTEMA: Responda EXCLUSIVAMENTE em ${langLabel}. Cidade selecionada: ${city}.]
Gere a análise final de moradia com base nas respostas do usuário abaixo. Retorne em JSON puro (sem markdown, sem \`\`\`) com esta estrutura:
{
  "analisePoetica": "uma frase poética sobre o perfil",
  "perfilResumido": "nome do arquétipo do morador",
  "pilares": {
    "corpo": "análise do pilar corpo/luz",
    "territorio": "análise do pilar território/ritmo",
    "outro": "análise do pilar outro/dinâmica",
    "espaco": "análise do pilar espaço/fronteira",
    "identidade": "análise do pilar identidade/valor"
  },
  "sugestoes": [
    { "bairro": "nome", "vibe": "tag curta", "descricaoVibe": "descrição de 1-2 frases" },
    { "bairro": "nome", "vibe": "tag curta", "descricaoVibe": "descrição de 1-2 frases" },
    { "bairro": "nome", "vibe": "tag curta", "descricaoVibe": "descrição de 1-2 frases" }
  ],
  "fechamento": "frase de encerramento poética"
}

Respostas do usuário:
${message}`;
    } else {
      inputText = `[SISTEMA: Responda EXCLUSIVAMENTE em ${langLabel}. Cidade: ${city}. Seja breve (1-2 frases), poético e acolhedor no estilo Boba/Feltrip.]
O usuário respondeu sobre o pilar "${mode}" com: "${message}"
Dê um breve reconhecimento empático sobre a resposta.`;
    }

    const command = new InvokeAgentCommand({
      agentId: Deno.env.get('HOUSING_AGENT_ID'),
      agentAliasId: Deno.env.get('HOUSING_AGENT_ALIAS_ID'),
      sessionId: sessionId || `housing-${Date.now()}`,
      inputText,
    })

    const response = await client.send(command)
    let completion = ""

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          completion += new TextDecoder().decode(event.chunk.bytes)
        }
      }
    }

    return new Response(JSON.stringify({ text: completion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Housing agent error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})