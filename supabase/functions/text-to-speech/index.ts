import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AWS_TTS_API_URL = "https://dwlov9q61f.execute-api.us-east-1.amazonaws.com/prod/text-to-speech";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    console.log("Proxying TTS request to AWS", {
      textLength: text.length,
      voice: voice || 'Camila',
    });

    // Envia para AWS Polly
    const response = await fetch(AWS_TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: voice || 'Camila', // Voz em português brasileira
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AWS TTS API error:", response.status, errorText);
      throw new Error(`AWS API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("AWS TTS response received");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in text-to-speech proxy:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to proxy TTS request to AWS'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
