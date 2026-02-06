import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use the key provided by the user in secrets
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
// Using a high-quality model for professional medical analysis
const OPENROUTER_MODEL = 'openai/gpt-oss-120b'; 

interface InteractionRequest {
  drugs: string[];
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { drugs } = await req.json() as InteractionRequest;

    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Please provide at least two drugs to check interactions.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENROUTER_API_KEY) {
      console.error('CRITICAL: OpenRouter API key is missing in environment variables!');
      return new Response(
        JSON.stringify({ error: 'Configuration Error: OpenRouter API Key is missing. Please set it in Supabase Secrets.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedDrugs = Array.from(
      new Set(
        drugs
          .map((drug) => drug?.trim())
          .filter((drug): drug is string => Boolean(drug))
      )
    ).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    const drugList = normalizedDrugs.join(', ');
    console.log(`🧠 Analyzing interactions for: ${drugList}`);
    console.log(`🔑 Using Model: ${OPENROUTER_MODEL}`);

    const prompt = `
    You are a highly experienced Clinical Pharmacist and DM (Doctor of Medicine) specialist.
    Your task is to analyze the drug interactions for the following medication list: "${drugList}".

    CRITICAL INSTRUCTION:
    - You MUST identify the interaction between Aspirin and Warfarin if they are present.
    - Be calm and concise. The user wants short, professional guidance that does not scare them.
    - Be deterministic. For the same input list, produce the same output every time.
    - Only mention interactions that are directly about the listed items.

    Analysis Requirements:
    1. **Analyze Interactions**: Check for Drug-Drug, Drug-Food, and Drug-Condition interactions.
    2. **Severity Classification**: Use ONLY these levels: "Critical", "Severe", "Moderate", "Mild".
    3. **Summarize**: Provide a short overall summary (max 1 short sentence).
    4. **Structure**: For each interaction, provide:
       - severity: The level.
       - title: Short interaction title (e.g., "Aspirin + Warfarin").
       - description: One short sentence in plain professional language. If a medical term appears, add a layman hint in parentheses (e.g., "hypertension (high blood pressure)").
       - recommendation: One short sentence with the safest next step.
    5. **Limit**: Return only the most important 1–2 interactions.
    6. **Serious only**: Only include interactions that are Critical or Severe. If only Moderate/Mild exist, return empty interactions.
    7. **If none**: Return empty interactions and set summary to "No significant interactions. This combination is generally safe."

    Output Format:
    Return a JSON object with keys "summary" and "interactions".

    Example Output:
    {
      "summary": "Some combinations need extra caution, but risks are manageable with monitoring.",
      "interactions": [
        {
          "severity": "Critical",
          "title": "Aspirin + Warfarin",
          "description": "Together they increase bleeding risk due to additive blood-thinning effects.",
          "recommendation": "Avoid unless a doctor directs close monitoring."
        },
        {
          "severity": "Moderate",
          "title": "Ibuprofen + Lisinopril",
          "description": "NSAIDs can reduce blood pressure control and stress the kidneys.",
          "recommendation": "Use the lowest dose and monitor blood pressure and kidney function."
        }
      ]
    }
    `;

    console.log('🚀 Sending request to OpenRouter...');
    const startTime = performance.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mypharmalens.com',
        'X-Title': 'PharmaLens',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional DM Doctor and Clinical Pharmacist. You prioritize patient safety above all else. You never miss critical interactions like Warfarin+Aspirin.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        top_p: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
        response_format: { type: 'json_object' }
      })
    });

    const duration = Math.round(performance.now() - startTime);
    console.log(`⏱️ OpenRouter responded in ${duration}ms`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ OpenRouter API Error: ${response.status}`, errText);
      return new Response(
        JSON.stringify({ error: `AI Provider Error (${response.status}): ${errText}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('✅ OpenRouter response received');
    
    interface Interaction {
      severity: string;
      title: string;
      description: string;
      recommendation: string;
    }

    const content = data.choices[0]?.message?.content;
    console.log('📄 Raw Content:', content?.substring(0, 100) + '...'); 

    let interactions: Interaction[] = [];
    let summary = '';

    if (content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.interactions)) {
            // Validate structure loosely
            interactions = parsed.interactions.map((i: any) => ({
              severity: i.severity || 'Moderate',
              title: i.title || 'Interaction Detected',
              description: i.description || (typeof i === 'string' ? i : 'No description available'),
              recommendation: i.recommendation || 'Consult your doctor.'
            }));
            summary = typeof parsed.summary === 'string' ? parsed.summary : '';
            console.log(`💡 Parsed ${interactions.length} interactions from JSON`);
          } else {
             console.warn('⚠️ JSON found but "interactions" array missing', parsed);
          }
        } else {
           console.warn('⚠️ No JSON object found in response');
        }
      } catch (e) {
        console.error('❌ Failed to parse JSON from AI response:', e);
      }
      
      // Fallback logic removed as we strongly enforce JSON now and simple text splitting won't match the new UI object structure
    } else {
        console.error('❌ No content in OpenRouter response choices');
    }

    interactions = interactions
      .map((interaction) => ({
        ...interaction,
        severity: interaction.severity
          ? interaction.severity.charAt(0).toUpperCase() + interaction.severity.slice(1).toLowerCase()
          : 'Moderate'
      }))
      .filter((interaction) => interaction.severity === 'Critical' || interaction.severity === 'Severe');

    if (interactions.length === 0) {
      summary = summary || 'No significant interactions. This combination is generally safe.';
    }

    console.log(`📤 Returning ${interactions.length} interactions`);

    return new Response(
      JSON.stringify({ summary, interactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-interactions:', error);
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${error.message || 'Unknown error'}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
