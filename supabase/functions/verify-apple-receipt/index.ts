import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento dos produtos da Apple para os planos do seu app
const PRODUCT_TIER_MAP: Record<string, string> = {
    "com.feltrip.cult.roteiro": "personal_map",
    "com.feltrip.cult.imersao": "explorer",
};

// URL da Apple (Começamos com Produção, se der erro de teste, vamos pro Sandbox)
const APPLE_PROD_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";

serve(async (req) => {
    // Lida com a requisição de pré-checagem do navegador (CORS)
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { receipt, userId } = await req.json();

        if (!receipt || !userId) {
            throw new Error("Faltam dados: Recibo ou ID do usuário não enviados.");
        }

        // 1. Pergunta para a Apple se o recibo é verdadeiro (Produção)
        let appleResponse = await fetch(APPLE_PROD_URL, {
            method: "POST",
            body: JSON.stringify({ "receipt-data": receipt }),
        });
        let appleData = await appleResponse.json();

        // 2. O código 21007 significa que o recibo é de teste (TestFlight/Sandbox). 
        // Se for isso, tentamos de novo no servidor de testes.
        if (appleData.status === 21007) {
            appleResponse = await fetch(APPLE_SANDBOX_URL, {
                method: "POST",
                body: JSON.stringify({ "receipt-data": receipt }),
            });
            appleData = await appleResponse.json();
        }

        // Se o status final não for 0, o recibo é falso ou inválido.
        if (appleData.status !== 0) {
            throw new Error(`Recibo inválido da Apple. Status: ${appleData.status}`);
        }

        // 3. Descobre o que o cara comprou olhando o recibo
        // Pegamos a última compra da lista
        const latestReceiptInfo = appleData.receipt.in_app;
        const lastPurchase = latestReceiptInfo[latestReceiptInfo.length - 1];
        const productId = lastPurchase.product_id;

        const purchasedTier = PRODUCT_TIER_MAP[productId] || "explorer";

        // 4. Conecta no seu banco de dados como "Super Administrador" para atualizar o plano
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Calcula o vencimento (1 ano de acesso a partir de hoje)
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        // Salva o novo nível do usuário no banco!
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                tier: purchasedTier,
                subscription_end_date: expirationDate.toISOString(),
            })
            .eq("id", userId);

        if (updateError) throw updateError;

        // Retorna Sucesso pro aplicativo liberar a catraca
        return new Response(JSON.stringify({ success: true, tier: purchasedTier }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Erro no processamento da Apple:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});