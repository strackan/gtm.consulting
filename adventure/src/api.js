// API helpers for Supabase edge functions

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function fnUrl(name) {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

/**
 * Look up a visitor by their personalized URL slug.
 * Returns { name, company, role, context } or null.
 */
export async function lookupVisitor(slug) {
  if (!SUPABASE_URL) return null;
  try {
    const res = await fetch(fnUrl('adventure-lookup'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Send a phone message from the adventure (fire-and-forget).
 * Posts to founder_os.messages via edge function.
 */
export async function postPhoneMessage(visitorId, visitorName, message) {
  if (!SUPABASE_URL) return;
  try {
    await fetch(fnUrl('adventure-phone-message'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ visitor_id: visitorId, visitor_name: visitorName, message }),
    });
  } catch {
    // Non-critical — don't block the UX
  }
}

/**
 * Stream a ghost customer chat response.
 * Returns a ReadableStream of text chunks.
 * The last chunk may contain <!-- METADATA: {...} --> which should be stripped and parsed.
 */
export async function streamGhostChat(scenarioId, systemPrompt, messages, visitorProfile) {
  const res = await fetch(fnUrl('adventure-ghost-chat'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      scenario_id: scenarioId,
      system_prompt: systemPrompt,
      messages,
      visitor_profile: visitorProfile,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ghost chat failed: ${res.status}`);
  }

  return res.body;
}

/**
 * Score a completed ghost session.
 * Returns { score_discovery, score_action, score_efficiency, score_total, result_label, missed_facts }.
 */
export async function scoreSession(scenarioId, transcript, factsDiscovered, actionChosen, scoringContext) {
  const res = await fetch(fnUrl('adventure-score'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      scenario_id: scenarioId,
      transcript,
      facts_discovered: factsDiscovered,
      action_chosen: actionChosen,
      scoring_context: scoringContext,
    }),
  });

  if (!res.ok) {
    throw new Error(`Scoring failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Save a session to the database (fire-and-forget).
 */
export async function saveSession(visitorId, scenarioId, data) {
  if (!SUPABASE_URL) return;
  try {
    await fetch(fnUrl('adventure-score'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ save: true, visitor_id: visitorId, scenario_id: scenarioId, ...data }),
    });
  } catch {
    // Non-critical, don't block the UX
  }
}

/**
 * Extract metadata from a ghost response.
 * Looks for <!-- METADATA: {...} --> and returns the parsed JSON + clean text.
 */
export function extractMetadata(fullText) {
  const match = fullText.match(/<!--\s*METADATA:\s*(\{.*?\})\s*-->/s);
  if (!match) return { text: fullText, metadata: null };

  const cleanText = fullText.replace(/<!--\s*METADATA:\s*\{.*?\}\s*-->/s, '').trim();
  try {
    const metadata = JSON.parse(match[1]);
    return { text: cleanText, metadata };
  } catch {
    return { text: cleanText, metadata: null };
  }
}
