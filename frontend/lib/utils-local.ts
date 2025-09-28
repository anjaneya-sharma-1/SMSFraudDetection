export function extractUrls(text: string): string[] {
  // Basic URL regex; avoids hardcoded domain logic, just extracts candidates
  const urlRegex = /\b(?:(?:https?:\/\/)|(?:www\.))[\w-]+(?:\.[\w\-.]+)+(?::\d+)?(?:\/[^\s]*)?\b/gi
  const matches = text.match(urlRegex) || []
  // Normalize to include scheme
  return matches.map((m) => (m.startsWith("http") ? m : `https://${m}`))
}

export function safeJson<T = unknown>(raw: string): T | null {
  try {
    // Strip code fences if present
    const cleaned = raw
      .replace(/```json/gi, "```")
      .replace(/```/g, "")
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}
