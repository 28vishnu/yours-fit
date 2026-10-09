// Server-side Gemini integration starter. Deploy with Supabase CLI.
// Set: supabase secrets set GEMINI_API_KEY=...
// Configure JWT verification for this function and keep user data scoped to the authenticated user.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  // Fail closed by default: configure a server-side allowlist token for the starter endpoint.
  // For production, replace this with Supabase JWT verification and an allowlisted auth user ID.
  const expectedToken = Deno.env.get("FITNESS_AI_ACCESS_TOKEN");
  const suppliedToken = req.headers.get("x-fitness-access-token");
  if (!expectedToken || !suppliedToken || suppliedToken !== expectedToken) {
    return new Response(JSON.stringify({ error: "AI endpoint access is not configured or authorized. Complete Supabase Auth/JWT verification before production." }), { status: 401, headers: cors });
  }
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "AI is not configured. Add GEMINI_API_KEY to Supabase secrets." }), { status: 503, headers: cors });

  try {
    const body = await req.json();
    const allowedActions = ["chat", "daily-plan", "meal-plan", "weekly-report", "monthly-report", "workout-analysis", "hydration-analysis"];
    if (!body || !allowedActions.includes(body.action) || typeof body.prompt !== "string" || body.prompt.length > 12000) {
      return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400, headers: cors });
    }
    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are Yours Fit, a concise, evidence-informed fitness and nutrition coach. Use only supplied facts. Label estimates and uncertainty. Do not provide medical diagnosis, extreme diets, or unsafe training advice." }] },
        contents: [{ role: "user", parts: [{ text: body.prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1200 }
      })
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Gemini request failed. Check server configuration and API limits." }), { status: 502, headers: cors });
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: {text?:string}) => p.text ?? "").join("") ?? "";
    if (!text) return new Response(JSON.stringify({ error: "The AI returned an empty response." }), { status: 502, headers: cors });
    return new Response(JSON.stringify({ text }), { status: 200, headers: cors });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request or temporary AI service error." }), { status: 400, headers: cors });
  }
});