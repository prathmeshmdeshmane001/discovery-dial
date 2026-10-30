export function getTrackFallbackReason(track, vibeSeed, idx = 0) {
  const seedWord = vibeSeed?.split(",")?.[0]?.trim() || "core";
  const templates = [
    `Shares the ${seedWord} feel of the vibe, but from a lesser-known artist that pushes past the usual rotation.`,
    `Brings a distinct ${track?.mood || "expressive"} dynamic that complements the current vibe while widening your palette.`,
    `Deep-cut selection with ${track?.energy ? `energy level ${track.energy}/5` : "contrasting texture"} designed to expand your rotation seamlessly.`,
    `Expands the sound with unique production subtleties that stay anchored to your chosen vibe.`,
    `A standout ${track?.year ? `${track.year} ` : ""}track capturing an alternative angle of the vibe without breaking playlist flow.`,
  ];
  return templates[idx % templates.length];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { vibeLabel, vibeSeed, tracks } = body || {};
  const list = Array.isArray(tracks) ? tracks.slice(0, 10) : [];

  const fallback = (debug) =>
    res.status(200).json({
      source: "fallback",
      debug,
      reasons: list.map((t, idx) => ({
        id: t.id,
        why: getTrackFallbackReason(t, vibeSeed, idx),
      })),
    });

  const key = process.env.GROQ_API_KEY;
  if (!key) return fallback("NO_KEY");
  if (list.length === 0) return fallback("NO_TRACKS");

  const prompt = `You are a music critic writing one-line liner notes for a discovery playlist. The chosen vibe is "${vibeLabel}" — ${vibeSeed}.

Below are lesser-known tracks slotted into this vibe to stretch the listener's taste. For EACH track, write ONE short sentence (max 18 words) explaining why it belongs in this vibe but opens something new.

STRICT RULES:
- Each sentence MUST be distinct. Never repeat phrasing, opening words, or sentence structure across tracks.
- Pick ONE angle per track: texture/sound, era/scene, mood shift, energy contrast, lyrical bent, production feel. Use a DIFFERENT angle for each track.
- Be concrete. Avoid generic praise.
- Do NOT use "you" or "your".
- Do NOT repeat the track title or artist name.

Tracks:
${list.map((t, i) => `${i + 1}. "${t.title}" by ${t.artist} — mood: ${t.mood}, energy ${t.energy}/5${t.year ? `, ${t.year}` : ""}`).join("\n")}

Respond ONLY with a JSON array like [{"i":1,"why":"..."},{"i":2,"why":"..."}]. No prose, no markdown.`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.85,
        top_p: 0.95,
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const statusCode = r.status;
    const rawText = await r.text();

    if (!r.ok) {
      return res.status(200).json({
        source: "fallback",
        debug: `GROQ_${statusCode}`,
        groq_error: rawText.slice(0, 300),
        reasons: list.map((t, idx) => ({
          id: t.id,
          why: getTrackFallbackReason(t, vibeSeed, idx),
        })),
      });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return fallback("JSON_PARSE_FAIL");
    }

    let text = data?.choices?.[0]?.message?.content?.trim() || "";
    // Robustly extract JSON array in case LLM wrapped it in markdown or introductory text
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return fallback("RESPONSE_PARSE_FAIL");
    }

    if (!Array.isArray(parsed)) {
      return fallback("NOT_ARRAY");
    }

    const seen = new Set();
    const reasons = list.map((t, idx) => {
      const match = parsed.find((p) => Number(p.i) === idx + 1);
      let why = match?.why?.trim();
      if (!why || why.toLowerCase() === "fallback" || seen.has(why.toLowerCase())) {
        why = getTrackFallbackReason(t, vibeSeed, idx);
      }
      seen.add(why.toLowerCase());
      return { id: t.id, why };
    });

    return res.status(200).json({ source: "groq", reasons });
  } catch (err) {
    return res.status(200).json({
      source: "fallback",
      debug: "EXCEPTION",
      error_message: err.message,
      reasons: list.map((t, idx) => ({
        id: t.id,
        why: getTrackFallbackReason(t, vibeSeed, idx),
      })),
    });
  }
}
