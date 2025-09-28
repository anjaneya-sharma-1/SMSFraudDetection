export type AgentKey = "content" | "link" | "sender" | "context"

export type AgentResult = {
  key: AgentKey
  name: string
  score: number // 0..1
  signals: string[]
  features: string[]
  rationale?: string
}

export type DecisionResult = {
  risk: "low" | "medium" | "high"
  confidence?: number // 0..1
  explanation: string
}

export type MLResult = {
  prediction: string // 'ham', 'spam', 'smishing', etc.
  confidence: number // 0..1
  probabilities: Record<string, number>
  is_fraud: boolean
  available: boolean // whether ML service was reachable
}

export type AnalysisResult = {
  input: {
    text: string
    receivedAt?: string
    priorFromSender?: number
    expected?: boolean
  }
  ml: MLResult
  agents: {
    content: AgentResult
    link: AgentResult
    sender: AgentResult
    context: AgentResult
  }
  overall: DecisionResult
  urls?: string[]
}

export type UserFeedbackPayload = {
  correct: boolean
  note?: string
  analysis: AnalysisResult
}
