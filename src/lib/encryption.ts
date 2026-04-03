const ENCRYPTION_FUNCTION_URL = "https://udpesustqkrbeijgymqh.supabase.co/functions/v1/encryption";

interface EncryptResponse {
  encrypted: Record<string, string>;
  is_encrypted: boolean;
}

interface DecryptResponse {
  decrypted: Record<string, string>;
}

/**
 * Encrypts specified fields of data object
 */
export async function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: string[]
): Promise<{ encryptedData: Record<string, unknown>; is_encrypted: boolean }> {
  try {
    const response = await fetch(ENCRYPTION_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcGVzdXN0cWtyYmVpamd5bXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTM0NzIsImV4cCI6MjA3OTM4OTQ3Mn0.uIXYP03asZF3h8T8OuJkeFEKwaQZWCMAb1Ih1UqMan8",
      },
      body: JSON.stringify({ action: "encrypt", data, fields }),
    });

    if (!response.ok) {
      throw new Error("Encryption failed");
    }

    const result: EncryptResponse = await response.json();
    return {
      encryptedData: { ...result.encrypted },
      is_encrypted: result.is_encrypted,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    // Return original data if encryption fails
    return { encryptedData: {}, is_encrypted: false };
  }
}

/**
 * Decrypts specified fields of data object
 */
export async function decryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: string[]
): Promise<Record<string, string>> {
  try {
    const response = await fetch(ENCRYPTION_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcGVzdXN0cWtyYmVpamd5bXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTM0NzIsImV4cCI6MjA3OTM4OTQ3Mn0.uIXYP03asZF3h8T8OuJkeFEKwaQZWCMAb1Ih1UqMan8",
      },
      body: JSON.stringify({ action: "decrypt", data, fields }),
    });

    if (!response.ok) {
      throw new Error("Decryption failed");
    }

    const result: DecryptResponse = await response.json();
    return result.decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    // Return original fields if decryption fails
    const fallback: Record<string, string> = {};
    for (const field of fields) {
      if (data[field]) {
        fallback[field] = String(data[field]);
      }
    }
    return fallback;
  }
}

/**
 * Triggers migration of existing data to encrypted format
 * Should only be called by admin users
 */
export async function migrateExistingData(): Promise<{
  success: boolean;
  results?: Record<string, { migrated: number; errors: number }>;
  error?: string;
}> {
  try {
    const response = await fetch(ENCRYPTION_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcGVzdXN0cWtyYmVpamd5bXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTM0NzIsImV4cCI6MjA3OTM4OTQ3Mn0.uIXYP03asZF3h8T8OuJkeFEKwaQZWCMAb1Ih1UqMan8",
      },
      body: JSON.stringify({ action: "migrate" }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Migration failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Migration error:", error);
    return { success: false, error: String(error) };
  }
}

// Field mappings for each table
export const ENCRYPTION_FIELDS = {
  private_messages: ["content"],
  diary_entries: ["note"],
  travel_documents: ["name", "notes", "link"],
  user_annotations: ["title", "content", "link"],
  community_events: ["title", "description", "location"],
  community_posts: ["content"],
  map_pins: ["title", "content"],
  map_pin_comments: ["content"],
  presence_questionnaires: ["poetic_response"],
  profiles: ["full_name", "city"],
} as const;