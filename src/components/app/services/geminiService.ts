/// <reference types="vite/client" />
import { supabase } from "@/integrations/supabase/client";

let currentSystemInstruction: string = "";

export const startChatSession = async (systemInstruction: string) => {
  currentSystemInstruction = systemInstruction;
  return null;
};

export interface GeminiResponse {
  text: string;
}

export const sendMessageToGemini = async (message: string, sessionId?: string): Promise<string> => {
  try {
    // Chama a Edge Function correta no Supabase
    const { data, error } = await supabase.functions.invoke("chat-agent", {
      body: {
        message,
        sessionId,
        systemInstruction: currentSystemInstruction,
      },
    });

    if (error) {
      throw new Error(error.message || "Erro na Edge Function");
    }

    if (!data?.text) {
      throw new Error("O Agente AWS retornou uma resposta vazia.");
    }

    return data.text;
  } catch (error: any) {
    console.error("Erro na ponte da IA:", error);
    return `Connection error: ${error?.message || "Please try again."}. Try again.`;
  }
};
