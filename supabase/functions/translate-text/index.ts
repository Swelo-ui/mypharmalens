
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLang = 'en' } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Missing text to translate" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Translate API
    const apiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
    
    if (!apiKey) {
      console.error("GOOGLE_TRANSLATE_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: "Translation service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Translation API error: ${errorData}`);
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;
    const detectedLanguage = data.data.translations[0].detectedSourceLanguage;

    return new Response(
      JSON.stringify({ 
        translatedText,
        originalText: text,
        detectedLanguage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
