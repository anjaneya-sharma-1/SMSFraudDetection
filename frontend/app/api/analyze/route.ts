import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import type { AnalysisResult, AgentResult, DecisionResult, DetectionMethod } from "@/lib/types"
import { clamp01, extractUrls, safeJson } from "@/lib/utils-local"

// Configure function timeout for Vercel
export const maxDuration = 30

type AgentJSON = {
  // Suspicion score 0..1 where 1.0 == most suspicious. Higher score means more suspicious.
  suspicionScore: number
  // Optional: agent classification: "benign" | "suspicious" | "unknown"
  classification?: string
  // Language of the original input, if applicable (e.g., "hi", "pa", "en")
  language?: string
  signals: string[]
  features: string[]
  rationale?: string
  confidence?: number
}

type MLResponse = {
  prediction: string
  confidence: number
  probabilities: Record<string, number>
  is_fraud: boolean
  language?: string | null
  original_text?: string | null
}

const AGENTS = {
  content: {
    key: "content",
    name: "Content Analysis Agent",
    system:
      "You are the Content Analysis Agent. Detect fraud indicators in SMS content without using hardcoded rules. Analyze semantics, intent, and psychological manipulation patterns (urgency, fear, authority pressure, rewards). If an English translation is provided, analyze using the translation but consider transliteration or language-specific cues from the original text. The Indian languages to look for include: Hindi (hi), Bengali (bn), Punjabi (pa), Tamil (ta), Telugu (te), Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml), Odia (or), Assamese (as). If you detect a regional language, include it in 'language' and factor local norms into your analysis. Output only strict JSON as per the schema.",
  },
  link: {
    key: "link",
    name: "Link Security Agent",
    system:
      "You are the Link Security Agent. Extract and analyze URLs for suspicious indicators, spoofed domains, lookalikes, and risky redirects. Consider domain structure, TLD, path/query oddities. If provided, use the English translation but also note transliteration, URL shortener clues or language-decoding anomalies from the original message. If you detect a regional Indian language, include the code in 'language' and call out local TLD or transliteration anomalies. Output only strict JSON as per the schema.",
  },
  sender: {
    key: "sender",
    name: "Sender Verification Agent",
    system:
      "You are the Sender Verification Agent. Assess sender authenticity based on SMS text clues (claimed brand, phone number patterns, reply-to behaviors) and potential spoofing or impersonation signals. Use the translated English text for analysis when present; also consider transliteration, grammar, or linguistic clues in the original text indicating impersonation. If you detect a regional language, include the code in 'language' and consider sender-language consistency (e.g., local banks using local languages). Output only strict JSON as per the schema.",
  },
  context: {
    key: "context",
    name: "Context Awareness Agent",
    system:
      "You are the Context Awareness Agent. Evaluate risk from timing, frequency, and expectedness context. Consider if message is expected, recent frequency from sender, and timing anomalies (off-hours). If provided, use the English translation for semantic cues, and note how detected language may affect expectedness (e.g., Indian regional language used by local banks vs code-mix). If you detect a regional language, include the code and comment if the sender's language usage is expected for the sender. Output only strict JSON as per the schema.",
  },
} as const

const DEFAULT_AGENT_MODEL = process.env.AGENT_MODEL || 'llama-3.1-8b-instant'
const DEFAULT_DECISION_MODEL = process.env.DECISION_MODEL || 'llama-3.3-70b-versatile'

const AGENT_OUTPUT_SCHEMA = `
Return a JSON object with:
{
  "classification": "benign" | "suspicious" | "unknown",
  "suspicionScore": number between 0 and 1, // Higher means more suspicious
  "confidence": number between 0 and 1, // agent's internal confidence about its outputs
  "language": string (optional) // detected original language code if relevant
  "mismatchExplanation": string (optional) // if classification and suspicionScore disagree, explain why
  "signals": string[] (short bullet hints of suspicious/benign cues),
  "features": string[] (structured features you derived, e.g., extracted entities, patterns),
  "rationale": string (1-2 sentences)
}
Only return JSON. Do not include any other text.
`

const DECISION_SYSTEM = `
You are the Decision Engine. Combine four LLM agent outputs AND a traditional ML prediction to classify overall risk.

Consider:
- Traditional ML model (SVM + TF-IDF) provides fast, statistical analysis with 93.97% accuracy
- LLM agents provide contextual understanding and reasoning
- Weight both approaches: ML for statistical patterns, LLM for context and edge cases
- When ML and LLM disagree, explain why and make a reasoned decision
 - If any LLM agent has a mismatch (classification vs suspicionScore), use the agent's mismatchExplanation and rationale to understand the disagreement
 - When translation is used, consider downweighting ML, and prefer agent-level language-aware signals

Output only strict JSON with:
{
  "risk": "low" | "medium" | "high",
  "confidence": number between 0 and 1,
  "explanation": string (brief, user-facing that mentions both ML and LLM insights)
}
Only return JSON.
`

async function callMLService(text: string, meta?: { original_text?: string; language?: string }): Promise<MLResponse | null> {
  try {
    // Use environment variable for ML service URL, fallback to localhost for development
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    
    const payload: any = { text }
    if (meta?.original_text) payload.original_text = meta.original_text
    if (meta?.language) payload.language = meta.language

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('ML service error:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to call ML service:', error);
    return null;
  }
}

// Detect language and translate to English using the LLM. Returns { language, translated }
async function detectAndTranslate(text: string) {
  try {
    const TRANSLATION_MODEL = process.env.TRANSLATION_MODEL || 'llama-3.3-70b-versatile'
    const translatePrompt = `
Detect the primary language of the following SMS and, if it is not English, return a JSON object with the detected language (ISO two-letter or common name) and a clear English translation.

Only respond with JSON. Example: {"language":"hi", "translation":"This is the english translation"}

Text:
"""
${text}
"""

If the input is already in English, return language: "en" and the original text unchanged in translation.
`.trim()

    const res = await generateText({
      model: groq(TRANSLATION_MODEL),
      system: 'You are a translation assistant. Return only JSON with language and translation fields.',
      prompt: translatePrompt,
      temperature: 0.0,
    })

    // Try to parse safely
    const parsed = safeJson<{ language: string; translation: string }>(res.text)
    if (parsed && parsed.translation) {
      return { language: parsed.language ?? 'unknown', translated: parsed.translation }
    }

    // Fallback: no parse, return original
    return { language: 'unknown', translated: text }
  } catch (e) {
    console.error('Translation failed:', e)
    return { language: 'unknown', translated: text }
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const text = (body?.text ?? "") as string
  const receivedAt = (body?.receivedAt ?? undefined) as string | undefined
  const priorFromSender = (body?.priorFromSender ?? undefined) as number | undefined
  const expected = (body?.expected ?? undefined) as boolean | undefined
  const detectionMethod = (body?.detectionMethod ?? "both") as "ml-only" | "agents-only" | "both"

  if (!text || typeof text !== "string" || text.length > 8000) {
    return NextResponse.json({ error: "Provide SMS text (<= 8000 chars)" }, { status: 400 })
  }

  // Translate and detect language first
  const tl = await detectAndTranslate(text)
  const originalLanguage = tl.language
  const translatedText = tl.translated
  const urls = extractUrls(translatedText)

  // Build prompts per-agent (only if agents are needed) — use translated text with original for reference
  const agentText = `TranslatedEnglish:
"""${translatedText}"""

OriginalText:
"""${text}"""`

  const contentUser = `
SMS:
${agentText}

${AGENT_OUTPUT_SCHEMA}
`.trim()

  const linkUser = `
SMS:
${agentText}

Extracted URLs (may be empty): ${JSON.stringify(urls)}

${AGENT_OUTPUT_SCHEMA}
`.trim()

    const senderUser = `
    SMS:
    ${agentText}

    ${AGENT_OUTPUT_SCHEMA}
    `.trim()

    const contextUser = `
    SMS:
    ${agentText}

    Optional context:
    - receivedAt: ${receivedAt ?? "unknown"}
    - priorFromSender (7d): ${priorFromSender ?? "unknown"}
    - expected: ${expected ?? "unknown"}

    ${AGENT_OUTPUT_SCHEMA}
    `.trim()

  // Run ML and/or agents based on selected method
  let mlResult: MLResponse | null = null
  let contentRes: any = null
  let linkRes: any = null
  let senderRes: any = null
  let contextRes: any = null

  if (detectionMethod === "ml-only" || detectionMethod === "both") {
    // Send translated text to the ML service for better, English-trained models
    mlResult = await callMLService(translatedText, { original_text: text, language: originalLanguage })
  }

  if (detectionMethod === "agents-only" || detectionMethod === "both") {
    [contentRes, linkRes, senderRes, contextRes] = await Promise.all([
      generateText({
        model: groq(DEFAULT_AGENT_MODEL),
        system: AGENTS.content.system + " If the original text is non-English, use the provided translation. Mention the detected language in the rationale when relevant. Use the suspicionScore thresholds to set classification: suspicionScore >= 0.7 -> 'suspicious', <= 0.4 -> 'benign', otherwise 'unknown'. If you choose a different classification from this heuristic, include a 'mismatchExplanation' field explaining why.",
        prompt: contentUser,
        temperature: 0.2,
      }),
      generateText({
        model: groq(DEFAULT_AGENT_MODEL),
        system: AGENTS.link.system + " If the original text is non-English, analyze links from the English translation but note transliteration/encoding anomalies and language indicators where present. Use the suspicionScore thresholds and set classification, explaining mismatches when present.",
          prompt: linkUser,
        temperature: 0.2,
      }),
      generateText({
        model: groq(DEFAULT_AGENT_MODEL),
        system: AGENTS.sender.system + " If the original text is non-English, analyze the translated English message and look for phonetic, grammatical, or transliteration clues referencing sender impersonation. Use the suspicionScore thresholds and set classification, explaining mismatches when present.",
          prompt: senderUser,
        temperature: 0.2,
      }),
      generateText({
        model: groq(DEFAULT_AGENT_MODEL),
        system: AGENTS.context.system + " If the original text is non-English, interpret timing/context signs from the translated text and note language-based signal impact on expectedness. Use the suspicionScore thresholds and set classification, explaining mismatches when present.",
          prompt: contextUser,
        temperature: 0.2,
      }),
    ])
  }

  // Parse agent JSONs safely (only if agents were run)
  let agents: any = null
  if (detectionMethod === "agents-only" || detectionMethod === "both") {
    const parsedContent = safeJson<AgentJSON>(contentRes.text)
    const parsedLink = safeJson<AgentJSON>(linkRes.text)
    const parsedSender = safeJson<AgentJSON>(senderRes.text)
    const parsedContext = safeJson<AgentJSON>(contextRes.text)

    const toAgentResult = (key: keyof typeof AGENTS, parsed: AgentJSON | null): AgentResult => {
      const def = AGENTS[key]
      return {
        key: def.key,
        name: def.name,
        // Map suspicionScore from agent output to score in the UI (0..1; higher==more suspicious)
        // Support old key 'score' for backward compatibility
        score: clamp01(parsed?.suspicionScore ?? parsed?.score ?? parsed?.confidence ?? 0.5),
        classification: (parsed?.classification as any) ?? undefined,
        language: parsed?.language ?? undefined,
        signals: parsed?.signals ?? [],
        features: parsed?.features ?? [],
        rationale: parsed?.rationale ?? "",
        mismatchExplanation: parsed?.mismatchExplanation ?? undefined,
      }
    }

    const contentAgent = toAgentResult("content", parsedContent)
    const linkAgent = toAgentResult("link", parsedLink)
    const senderAgent = toAgentResult("sender", parsedSender)
    const contextAgent = toAgentResult("context", parsedContext)

    agents = {
      content: contentAgent,
      link: linkAgent,
      sender: senderAgent,
      context: contextAgent,
    }
  }

  // Decision engine - adapt based on detection method
  let decisionUser: string = ""
  const translationCaveat = originalLanguage && originalLanguage !== 'en'
    ? '\nImportant: ML result is based on an English translation; translation ambiguity may reduce ML confidence for language-specific signals. Consider downweighting the ML result when merging.'
    : ''
  
  if (detectionMethod === "ml-only") {
    decisionUser = `
  Note:
  - Original language: ${originalLanguage}
  - Translated English (short): ${translatedText.slice(0, 120)}
  ${translationCaveat}

Traditional ML Prediction (SVM + TF-IDF, 93.97% accuracy):
${mlResult ? JSON.stringify({
  prediction: mlResult.prediction,
  confidence: mlResult.confidence,
  is_fraud: mlResult.is_fraud,
  probabilities: mlResult.probabilities
}) : "ML service unavailable"}

LLM agents were not used for this analysis (ML-only mode selected).

Classify overall risk based primarily on the ML prediction.
`.trim()
  } else if (detectionMethod === "agents-only") {
    decisionUser = `
Note:
- Original language: ${originalLanguage}
- Translated English (short): ${translatedText.slice(0, 120)}
${translationCaveat}

Traditional ML was not used for this analysis (agents-only mode selected).

Four LLM agent outputs (JSON):
- content: ${agents ? JSON.stringify(agents.content) : "Not available"}
- link: ${agents ? JSON.stringify(agents.link) : "Not available"}
- sender: ${agents ? JSON.stringify(agents.sender) : "Not available"}
- context: ${agents ? JSON.stringify(agents.context) : "Not available"}

Classify overall risk based on the LLM agent contextual analysis.
`.trim()
  } else {
    decisionUser = `
Note:
- Original language: ${originalLanguage}
- Translated English (short): ${translatedText.slice(0, 120)}
${translationCaveat}

Traditional ML Prediction (SVM + TF-IDF, 93.97% accuracy):
${mlResult ? JSON.stringify({
  prediction: mlResult.prediction,
  confidence: mlResult.confidence,
  is_fraud: mlResult.is_fraud,
  probabilities: mlResult.probabilities
}) : "ML service unavailable"}

Four LLM agent outputs (JSON):
- content: ${agents ? JSON.stringify(agents.content) : "Not available"}
- link: ${agents ? JSON.stringify(agents.link) : "Not available"}
- sender: ${agents ? JSON.stringify(agents.sender) : "Not available"}
- context: ${agents ? JSON.stringify(agents.context) : "Not available"}

Now classify overall risk combining both ML statistical analysis and LLM contextual reasoning.
`.trim()
  }

  const decisionRes = await generateText({
    model: groq(DEFAULT_DECISION_MODEL),
    system: DECISION_SYSTEM,
    prompt: decisionUser,
    temperature: 0.2,
  })

  const parsedDecision = safeJson<DecisionResult>(decisionRes.text) ?? {
    risk: "medium",
    confidence: 0.5,
    explanation: "Insufficient structured output; defaulted to medium risk.",
  }

  const result: AnalysisResult = {
    input: { text, receivedAt, priorFromSender, expected, detectionMethod, originalLanguage, translatedText },
    ml: mlResult ? {
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      probabilities: mlResult.probabilities,
      is_fraud: mlResult.is_fraud,
      available: true,
    } : null,
    agents: agents,
    overall: {
      risk: parsedDecision.risk,
      confidence: parsedDecision.confidence != null ? clamp01(parsedDecision.confidence) : undefined,
      explanation: parsedDecision.explanation ?? "",
    },
    urls,
  }

  return NextResponse.json(result, { status: 200 })
}
