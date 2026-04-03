import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256 encryption using Web Crypto API
async function getKey(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(plainText: string, keyString: string): Promise<string> {
  if (!plainText) return plainText;
  
  const key = await getKey(keyString);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );
  
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encryptedText: string, keyString: string): Promise<string> {
  if (!encryptedText) return encryptedText;
  
  try {
    const key = await getKey(keyString);
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedText;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY not configured");
    }

    const { action, data, fields } = await req.json();

    if (action === "encrypt") {
      const result: Record<string, string> = {};
      for (const field of fields) {
        if (data[field]) {
          result[`${field}_encrypted`] = await encrypt(data[field], encryptionKey);
        }
      }
      return new Response(JSON.stringify({ encrypted: result, is_encrypted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "decrypt") {
      const result: Record<string, string> = {};
      for (const field of fields) {
        const encryptedField = `${field}_encrypted`;
        if (data[encryptedField]) {
          result[field] = await decrypt(data[encryptedField], encryptionKey);
        } else if (data[field]) {
          result[field] = data[field];
        }
      }
      return new Response(JSON.stringify({ decrypted: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "migrate") {
      // Only owner/admin can trigger migration
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: userId });
      if (roleData !== "owner" && roleData !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden: admin/owner role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tables = [
        { name: "private_messages", fields: ["content"] },
        { name: "diary_entries", fields: ["note"] },
        { name: "travel_documents", fields: ["name", "notes", "link"] },
        { name: "user_annotations", fields: ["title", "content", "link"] },
        { name: "community_events", fields: ["title", "description", "location"] },
        { name: "community_posts", fields: ["content"] },
        { name: "map_pins", fields: ["title", "content"] },
        { name: "map_pin_comments", fields: ["content"] },
        { name: "presence_questionnaires", fields: ["poetic_response"] },
        { name: "profiles", fields: ["full_name", "city"] },
      ];

      const migrationResults: Record<string, { migrated: number; errors: number }> = {};

      for (const table of tables) {
        let migrated = 0;
        let errors = 0;

        const { data: rows, error } = await supabase
          .from(table.name)
          .select("*")
          .eq("is_encrypted", false);

        if (error) {
          console.error(`Error fetching ${table.name}:`, error);
          migrationResults[table.name] = { migrated: 0, errors: 1 };
          continue;
        }

        for (const row of rows || []) {
          try {
            const updates: Record<string, unknown> = { is_encrypted: true };
            
            for (const field of table.fields) {
              if (row[field]) {
                updates[`${field}_encrypted`] = await encrypt(row[field], encryptionKey);
              }
            }

            const { error: updateError } = await supabase
              .from(table.name)
              .update(updates)
              .eq("id", row.id);

            if (updateError) {
              console.error(`Error updating ${table.name} row ${row.id}:`, updateError);
              errors++;
            } else {
              migrated++;
            }
          } catch (e) {
            console.error(`Error processing ${table.name} row ${row.id}:`, e);
            errors++;
          }
        }

        migrationResults[table.name] = { migrated, errors };
      }

      return new Response(JSON.stringify({ success: true, results: migrationResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Encryption function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
