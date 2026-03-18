"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProject, type FundingModel } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type MilestoneDraft = { title: string; amount: string; due_at?: string }

export default function NewCampaignPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Tech")
  const [goalAmount, setGoalAmount] = useState("50000")
  const [currency, setCurrency] = useState("USD")
  const [fundingModel, setFundingModel] = useState<FundingModel>("aon")
  const [deadlineLocal, setDeadlineLocal] = useState("")
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ title: "Milestone 1", amount: "1000" }])
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null)
      if (!title.trim()) throw new Error("title is required")
      if (!category.trim()) throw new Error("category is required")
      const goal = Number(goalAmount)
      if (!Number.isFinite(goal) || goal <= 0) throw new Error("goal_amount must be a positive number")
      if (!deadlineLocal) throw new Error("deadline is required")

      const deadline = new Date(deadlineLocal)
      if (Number.isNaN(deadline.getTime())) throw new Error("deadline is invalid")

      const payload: any = {
        title: title.trim(),
        category: category.trim(),
        goal_amount: goal,
        currency: currency.trim() || "USD",
        funding_model: fundingModel,
        deadline: deadline.toISOString(),
      }

      if (fundingModel === "milestone") {
        payload.milestones = milestones
          .filter((m) => m.title.trim() && Number(m.amount) > 0)
          .map((m) => ({ title: m.title.trim(), amount: Number(m.amount), due_at: m.due_at }))
      }

      return createProject(payload)
    },
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
      router.push(`/campaigns/${project.slug}`)
    },
    onError: (e: any) => setError(e?.message || "Failed to create project"),
  })

  const minDeadline = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }, [])

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">Create Project</h1>
          <p className="text-muted-foreground mt-2">Start with a funding model: AON, KIA, or Milestone-based.</p>
        </div>
        <Link href="/campaigns">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Project Basics</CardTitle>
          <CardDescription>Requires a logged-in user with the creator role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Awesome Smart Wallet" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal_amount">Goal Amount</Label>
              <Input id="goal_amount" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} inputMode="decimal" />
            </div>

            <div className="space-y-2">
              <Label>Funding Model</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={fundingModel}
                onChange={(e) => setFundingModel(e.target.value as FundingModel)}
              >
                <option value="aon">All-or-Nothing (AON)</option>
                <option value="kia">Keep-it-All (KIA)</option>
                <option value="milestone">Milestone-based</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadlineLocal}
              min={minDeadline}
              onChange={(e) => setDeadlineLocal(e.target.value)}
            />
          </div>

          {fundingModel === "milestone" ? (
            <div className="space-y-4">
              <div className="text-sm font-semibold">Milestones</div>
              {milestones.map((m, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Title</Label>
                    <Input
                      value={m.title}
                      onChange={(e) =>
                        setMilestones((prev) => prev.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      value={m.amount}
                      inputMode="decimal"
                      onChange={(e) =>
                        setMilestones((prev) => prev.map((x, idx) => (idx === i ? { ...x, amount: e.target.value } : x)))
                      }
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setMilestones((prev) => [...prev, { title: `Milestone ${prev.length + 1}`, amount: "1000" }])}
              >
                Add Milestone
              </Button>
            </div>
          ) : null}

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-11 px-6">
              {mutation.isPending ? "Creating..." : "Create Project"}
            </Button>
            <Link href="/campaigns">
              <Button variant="ghost" className="h-11">
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
