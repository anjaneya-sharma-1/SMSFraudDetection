import { NextResponse } from "next/server"
import type { UserFeedbackPayload } from "@/lib/types"

// Configure function timeout for Vercel
export const maxDuration = 30

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<UserFeedbackPayload>
  if (typeof body.correct !== "boolean" || !body.analysis) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // For prototype: log feedback; can be wired to storage later (Supabase/Neon/Upstash)
  console.log("Feedback received:", {
    correct: body.correct,
    note: body.note ?? "",
    overall: body.analysis.overall,
    agents: Object.fromEntries(Object.entries(body.analysis.agents).map(([k, v]) => [k, { score: v.score }])),
    inputPreview: body.analysis.input.text.slice(0, 120),
  })

  return NextResponse.json({ ok: true })
}
