import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id, x-native-language, x-learning-language',
};

const AWS_TRANSCRIBE_API_URL = "https://dwlov9q61f.execute-api.us-east-1.amazonaws.com/prod/transcribe";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = req.headers.get('X-User-Id');
    const contentType = req.headers.get('Content-Type');

    if (!userId) {
      throw new Error('userId is required in X-User-Id header');
    }

    console.log("Proxying transcribe request to AWS", {
      contentType: contentType,
      userId: userId
    });

    // Lê o áudio binário diretamente do body
    const audioBuffer = await req.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('No audio data received');
    }

    console.log("Audio buffer size:", audioBuffer.byteLength);

    // Envia o áudio binário puro para a AWS com o userId no header
    const response = await fetch(AWS_TRANSCRIBE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'audio/webm',
        'X-User-Id': userId,
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AWS API error:", response.status, errorText);
      throw new Error(`AWS API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("AWS transcription received:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in aws-transcribe-proxy:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to proxy transcription request to AWS'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
