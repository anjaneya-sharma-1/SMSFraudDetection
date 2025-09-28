import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import type { AnalysisResult, AgentResult, DecisionResult, DetectionMethod } from "@/lib/types"
import { clamp01, extractUrls, safeJson } from "@/lib/utils-local"

// Configure function timeout for Vercel
export const maxDuration = 30

type AgentJSON = {
  score: number
  signals: string[]
  features: string[]
  rationale?: string
}

type MLResponse = {
  prediction: string
  confidence: number
  probabilities: Record<string, number>
  is_fraud: boolean
}

const AGENTS = {
  content: {
    key: "content",
    name: "Content Analysis Agent",
    system:
      "You are the Content Analysis Agent. Detect fraud indicators in SMS content without using hardcoded rules. Analyze semantics, intent, and psychological manipulation patterns (urgency, fear, authority pressure, rewards). Output only strict JSON.",
  },
  link: {
    key: "link",
    name: "Link Security Agent",
    system:
      "You are the Link Security Agent. Extract and analyze URLs for suspicious indicators, spoofed domains, lookalikes, and risky redirects. Consider domain structure, TLD, path/query oddities. Output only strict JSON.",
  },
  sender: {
    key: "sender",
    name: "Sender Verification Agent",
    system:
      "You are the Sender Verification Agent. Assess sender authenticity based on SMS text clues (claimed brand, phone number patterns, reply-to behaviors) and potential spoofing or impersonation signals. Output only strict JSON.",
  },
  context: {
    key: "context",
    name: "Context Awareness Agent",
    system:
      "You are the Context Awareness Agent. Evaluate risk from timing, frequency, and expectedness context. Consider if message is expected, recent frequency from sender, and timing anomalies (off-hours). Output only strict JSON.",
  },
} as const

const AGENT_OUTPUT_SCHEMA = `
Return a JSON object with:
{
  "score": number between 0 and 1,
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

Output only strict JSON with:
{
  "risk": "low" | "medium" | "high",
  "confidence": number between 0 and 1,
  "explanation": string (brief, user-facing that mentions both ML and LLM insights)
}
Only return JSON.
`

async function callMLService(text: string): Promise<MLResponse | null> {
  try {
    // Use environment variable for ML service URL, fallback to localhost for development
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
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

  const urls = extractUrls(text)

  // Build prompts per-agent (only if agents are needed)
  const contentUser = `
SMS:
"""${text}"""

${AGENT_OUTPUT_SCHEMA}
`.trim()

  const linkUser = `
SMS:
"""${text}"""

Extracted URLs (may be empty): ${JSON.stringify(urls)}

${AGENT_OUTPUT_SCHEMA}
`.trim()

  const senderUser = `
SMS:
"""${text}"""

${AGENT_OUTPUT_SCHEMA}
`.trim()

  const contextUser = `
SMS:
"""${text}"""

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
    mlResult = await callMLService(text)
  }

  if (detectionMethod === "agents-only" || detectionMethod === "both") {
    [contentRes, linkRes, senderRes, contextRes] = await Promise.all([
      generateText({
        model: groq("llama-3.3-70b-versatile"),
        system: AGENTS.content.system,
        prompt: contentUser,
        temperature: 0.2,
      }),
      generateText({
        model: groq("llama-3.1-8b-instant"),
        system: AGENTS.link.system,
        prompt: linkUser,
        temperature: 0.2,
      }),
      generateText({
        model: groq("llama-3.1-8b-instant"),
        system: AGENTS.sender.system,
        prompt: senderUser,
        temperature: 0.2,
      }),
      generateText({
        model: groq("llama-3.1-8b-instant"),
        system: AGENTS.context.system,
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
        score: clamp01(parsed?.score ?? 0.5),
        signals: parsed?.signals ?? [],
        features: parsed?.features ?? [],
        rationale: parsed?.rationale ?? "",
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
  
  if (detectionMethod === "ml-only") {
    decisionUser = `
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
    model: groq("llama-3.3-70b-versatile"),
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
    input: { text, receivedAt, priorFromSender, expected, detectionMethod },
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
