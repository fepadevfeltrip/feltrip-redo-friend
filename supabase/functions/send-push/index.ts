import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

serve(async (req) => {
  try {
    // 1. Recebe os dados de quem vamos notificar
    const { user_id, title, body } = await req.json();

    if (!user_id || !title || !body) {
      throw new Error("Faltam parâmetros: user_id, title ou body.");
    }

    // 2. Conecta no Supabase com permissão de administrador para ler o Token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('apns_token')
      .eq('id', user_id)
      .single();

    if (dbError || !profile?.apns_token) {
      throw new Error(`Token APNs não encontrado para o usuário: ${user_id}`);
    }

    const apnsToken = profile.apns_token;

    // 3. Puxa as suas chaves secretas do Cofre (usando os nomes do seu print!)
    const teamId = Deno.env.get('APPLE_TEAM_ID')!;
    const keyId = Deno.env.get('APPLE_P8_KEY_ID')!; // O nome exato que você usou
    const bundleId = Deno.env.get('APPLE_BUNDLE_ID')!;
    const privateKeyEnv = Deno.env.get('APPLE_P8_KEY')!;

    // 4. Cria o "Passaporte" (JWT) provando para a Apple que somos nós
    const privateKey = await jose.importPKCS8(privateKeyEnv, 'ES256');
    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt()
      .sign(privateKey);

    // 5. Envia a notificação direto para os servidores da Apple
    // Nota: api.push.apple.com é usado para TestFlight e App Store.
    const response = await fetch(`https://api.push.apple.com/3/device/${apnsToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
      },
      body: JSON.stringify({
        aps: {
          alert: { title, body },
          sound: 'default'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`A Apple recusou o envio: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Push enviado com sucesso!" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});