"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import useSWRMutation from "swr/mutation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AnalysisResult, AgentResult, UserFeedbackPayload } from "@/lib/types"

type AnalyzeBody = {
  text: string
  receivedAt?: string
  priorFromSender?: number
}

async function analyzeFetcher(url: string, { arg }: { arg: AnalyzeBody }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  if (!res.ok) throw new Error(`Analyze failed: ${res.status}`)
  return (await res.json()) as AnalysisResult
}

async function feedbackFetcher(url: string, { arg }: { arg: UserFeedbackPayload }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  if (!res.ok) throw new Error(`Feedback failed: ${res.status}`)
  return await res.json()
}

export default function SmsAnalyzerForm() {
  const [text, setText] = useState("")
  const [receivedAt, setReceivedAt] = useState<string>("")
  const [priorFromSender, setPriorFromSender] = useState<number | undefined>(undefined)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const { trigger: analyze, isMutating, data, error, reset } = useSWRMutation("/api/analyze", analyzeFetcher)
  const { trigger: sendFeedback, isMutating: feedbackSending } = useSWRMutation("/api/feedback", feedbackFetcher)

  const onFileChange = useCallback(async (file?: File | null) => {
    if (!file) return
    // Only text uploads; user said "paste or upload an SMS"
    const content = await file.text()
    setText(content)
  }, [])

  const onSubmit = useCallback(async () => {
    if (!text?.trim()) return
    const body: AnalyzeBody = {
      text,
      receivedAt: receivedAt || undefined,
      priorFromSender:
        typeof priorFromSender === "number" && !Number.isNaN(priorFromSender) ? priorFromSender : undefined,
    }
    await analyze(body)
  }, [text, receivedAt, priorFromSender, analyze])

  const onReset = useCallback(() => {
    setText("")
    setReceivedAt("")
    setPriorFromSender(undefined)
    reset()
  }, [reset])

  const onMark = useCallback(
    async (correct: boolean) => {
      if (!data) return
      const payload: UserFeedbackPayload = {
        correct,
        note: "",
        analysis: data,
      }
      await sendFeedback(payload)
    },
    [data, sendFeedback],
  )

  const riskColor = useMemo(() => {
    if (!data) return ""
    switch (data.overall.risk) {
      case "low":
        return "bg-green-100 text-green-900"
      case "medium":
        return "bg-yellow-100 text-yellow-900"
      case "high":
        return "bg-red-100 text-red-900"
      default:
        return ""
    }
  }, [data])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sms-text">SMS Text</Label>
          <Textarea
            id="sms-text"
            placeholder="Paste the SMS content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-40"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sms-file">Or upload .txt</Label>
          <Input
            id="sms-file"
            type="file"
            accept=".txt,text/plain"
            ref={fileRef}
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="received-at">Received At (optional)</Label>
          <Input
            id="received-at"
            type="datetime-local"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="prior-count">Prior messages from sender (last 7 days, optional)</Label>
          <Input
            id="prior-count"
            type="number"
            min={0}
            placeholder="e.g., 0"
            value={typeof priorFromSender === "number" ? String(priorFromSender) : ""}
            onChange={(e) => setPriorFromSender(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" onClick={onSubmit} disabled={isMutating}>
            {isMutating ? "Analyzing..." : "Run Analysis"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} disabled={isMutating}>
            Reset
          </Button>
        </div>

        {error && (
          <div className="text-destructive" role="alert">
            {String(error)}
          </div>
        )}
      </div>

      {data && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Classification</CardTitle>
              <CardDescription>Aggregated by Decision Engine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn("inline-flex rounded px-2 py-1 text-sm", riskColor)}>
                Risk: {data.overall.risk.toUpperCase()}{" "}
                {data.overall.confidence != null ? `• Confidence: ${Math.round(data.overall.confidence * 100)}%` : ""}
              </div>
              <div className="text-sm text-muted-foreground">{data.overall.explanation}</div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {/* Traditional ML Results */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    🤖 Traditional ML Model
                    <span className="text-xs font-normal text-muted-foreground">
                      (SVM + TF-IDF • 93.97% accuracy)
                    </span>
                  </CardTitle>
                  <div className={cn(
                    "inline-flex rounded px-2 py-1 text-xs font-medium",
                    data.ml.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {data.ml.available ? "✅ Available" : "❌ Unavailable"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.ml.available ? (
                  <>
                    <div className={cn(
                      "inline-flex rounded px-2 py-1 text-sm font-medium",
                      data.ml.is_fraud 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    )}>
                      {data.ml.prediction.toUpperCase()} • {Math.round(data.ml.confidence * 100)}% confidence
                    </div>
                    
                    {Object.keys(data.ml.probabilities).length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Class probabilities:</div>
                        {Object.entries(data.ml.probabilities).map(([cls, prob]) => (
                          <div key={cls} className="flex justify-between">
                            <span>{cls}:</span>
                            <span>{Math.round(prob * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    ML service unavailable. Using LLM agents only.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LLM Agent Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🧠 LLM Agents
                <span className="text-sm font-normal text-muted-foreground">
                  (Contextual Analysis)
                </span>
              </h3>
              <div className="grid gap-4">
                <AgentCard agent={data.agents.content} />
                <AgentCard agent={data.agents.link} />
                <AgentCard agent={data.agents.sender} />
                <AgentCard agent={data.agents.context} />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>Help improve the model over time</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => onMark(true)} disabled={feedbackSending}>
                {feedbackSending ? "Sending..." : "Mark as Correct"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onMark(false)} disabled={feedbackSending}>
                {feedbackSending ? "Sending..." : "Mark as Incorrect"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent }: { agent: AgentResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{agent.name}</CardTitle>
        <CardDescription>Score: {Math.round(agent.score * 100)}%</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {agent.signals?.length ? (
          <div className="space-y-1">
            <div className="text-sm font-medium">Signals</div>
            <ul className="list-disc pl-6 text-sm text-muted-foreground">
              {agent.signals.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {agent.features?.length ? (
          <div className="space-y-1">
            <div className="text-sm font-medium">Features</div>
            <ul className="list-disc pl-6 text-sm text-muted-foreground">
              {agent.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {agent.rationale ? <div className="text-sm text-muted-foreground">{agent.rationale}</div> : null}
      </CardContent>
    </Card>
  )
}
