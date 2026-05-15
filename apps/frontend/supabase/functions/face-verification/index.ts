// verify-face Edge Function
// Accepts POST { selfie_base64, avatar_url? }

interface RequestBody {
    selfie_base64: string;
    avatar_url?: string;
  }
  
  Deno.serve(async (req: Request) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
    };
  
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
  
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  
    const { selfie_base64, avatar_url } = body || {};
    if (!selfie_base64 || typeof selfie_base64 !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing selfie_base64' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing GEMINI_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  
    const selfieDataUri = selfie_base64.startsWith('data:') ? selfie_base64 : `data:image/jpeg;base64,${selfie_base64}`;
  
    const messages: any[] = [];
  
    messages.push({
      role: 'system',
      content: 'You are a strict but fair face verification system. Focus on facial features (eyes, nose, mouth, facial shape, scars, moles) and ignore clothing, hairstyle, background, and accessories. Return ONLY a raw JSON object with no markdown, no explanation, no code fences. Schema: { "face_detected": boolean, "match": boolean, "confidence": number, "reason": string }'
    });
  
    const userContent: any[] = [];
    userContent.push({ type: 'text', text: 'Analyze the provided image(s). Return ONLY a raw JSON object (no markdown, no code fences): { "face_detected": boolean, "match": boolean, "confidence": number (0-100), "reason": string }. If only one image is provided, set match to false.' });
  
    userContent.push({
      type: 'image_url',
      image_url: { url: selfieDataUri }
    });
  
    if (avatar_url && typeof avatar_url === 'string') {
      userContent.push({
        type: 'image_url',
        image_url: { url: avatar_url }
      });
    }
  
    messages.push({ role: 'user', content: userContent });
  
    const payload: any = {
      model: 'gemini-2.5-flash',
      messages,
      temperature: 0.0,
      max_tokens: 500,                              // ✅ fix 1: was 300, too low
      response_format: { type: 'json_object' },    // ✅ fix 2: forces raw JSON, no markdown fences
    };
  
    try {
      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit from Gemini' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
  
      if (!resp.ok) {
        const text = await resp.text();
        return new Response(JSON.stringify({ error: 'Gemini error', details: text }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
  
      const data = await resp.json();
  
      let resultJson: any = null;
      try {
        const choice = Array.isArray(data.choices) ? data.choices[0] : null;
        const msg = choice?.message ?? null;
        let text = '';
  
        if (msg) {
          const content = msg.content;
          if (typeof content === 'string') {
            text = content;
          } else if (Array.isArray(content)) {
            text = content.map((c: any) => c.text ?? '').join('');
          } else {
            text = JSON.stringify(content);
          }
        } else {
          text = JSON.stringify(data);
        }
  
        // Strip markdown code fences as a safety net even with response_format
        text = text.replace(/\s*/gi, '').replace(/```\s*/g, '').trim();
  
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
          resultJson = JSON.parse(m[0]);
        } else {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object') resultJson = parsed;
        }
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to parse Gemini response', details: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
  
      if (!resultJson) {
        return new Response(JSON.stringify({ error: 'No structured result from Gemini', raw: data }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
  
      const face_detected = Boolean(resultJson.face_detected);
      const match = Boolean(resultJson.match);
      let confidence = Number(resultJson.confidence);
      if (isNaN(confidence)) confidence = 0;
      if (confidence <= 1) confidence = Math.round(confidence * 100);
      if (confidence < 0) confidence = 0;
      if (confidence > 100) confidence = 100;
      const reason = typeof resultJson.reason === 'string' ? resultJson.reason : '';
  
      const finalMatch = avatar_url ? match : false;
  
      return new Response(JSON.stringify({ face_detected, match: finalMatch, confidence, reason }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  });