import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SmsAnalyzerForm from "@/components/sms-analyzer-form"

export default function Page() {
  return (
    <main className="container mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-balance">SMS Fraud Detection Prototype</h1>
        <p className="text-muted-foreground mt-2">
          Paste or upload an SMS, run multi-agent analysis, and review risk classification with explanation.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Analyze an SMS</CardTitle>
          <CardDescription>Content, links, sender verification, and context awareness agents</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <SmsAnalyzerForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
