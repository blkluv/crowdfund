"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  closeProject,
  createComment,
  createPledge,
  createUpdate,
  getProject,
  launchProject,
  listComments,
  listUpdates,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CampaignDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const queryClient = useQueryClient()

  const projectQuery = useQuery({
    queryKey: ["project", slug],
    queryFn: () => getProject(slug),
  })

  const project = projectQuery.data

  const [amount, setAmount] = useState("25")
  const [error, setError] = useState<string | null>(null)
  const [liveFunding, setLiveFunding] = useState<{ current_amount: number; backers_count: number } | null>(null)

  const fmt = useMemo(() => {
    const currency = project?.currency || "USD"
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 })
  }, [project?.currency])

  const launchMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Project not loaded")
      return launchProject(project.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
      await queryClient.invalidateQueries({ queryKey: ["project", slug] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Project not loaded")
      return closeProject(project.id, true)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
      await queryClient.invalidateQueries({ queryKey: ["project", slug] })
    },
  })

  const pledgeMutation = useMutation({
    mutationFn: async () => {
      setError(null)
      if (!project) throw new Error("Project not loaded")
      const a = Number(amount)
      if (!Number.isFinite(a) || a <= 0) throw new Error("amount must be a positive number")
      return createPledge(project.id, { amount: a })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
      await queryClient.invalidateQueries({ queryKey: ["project", slug] })
    },
    onError: (e: any) => setError(e?.message || "Failed to pledge"),
  })

  const commentsQuery = useQuery({
    queryKey: ["comments", project?.id],
    enabled: !!project?.id,
    queryFn: () => listComments(project!.id),
  })

  const updatesQuery = useQuery({
    queryKey: ["updates", project?.id],
    enabled: !!project?.id,
    queryFn: () => listUpdates(project!.id),
  })

  useEffect(() => {
    if (!project?.id) return
    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
    const es = new EventSource(`${apiBase}/projects/${project.id}/stream`)

    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data)
        if (payload?.type === "funding") {
          setLiveFunding({
            current_amount: Number(payload.current_amount) || 0,
            backers_count: Number(payload.backers_count) || 0,
          })
        }
      } catch {
        // ignore
      }
    }

    es.onerror = () => {
      es.close()
    }

    return () => es.close()
  }, [project?.id])

  if (projectQuery.isLoading) return <div className="container mx-auto px-4 py-16 text-muted-foreground">Loading...</div>
  if (projectQuery.isError || !project)
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-muted-foreground mb-6">Project not found.</div>
        <Link href="/campaigns">
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    )

  const currentAmount = liveFunding?.current_amount ?? project.current_amount
  const backers = liveFunding?.backers_count ?? project.backers_count
  const progress = project.goal_amount > 0 ? Math.min(100, Math.round((currentAmount / project.goal_amount) * 100)) : 0

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm text-muted-foreground mb-2">
            {project.category} · {project.funding_model.toUpperCase()} · <span className="font-semibold">{project.state}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">{project.title}</h1>
          <div className="text-muted-foreground mt-3">
            {backers} backers · Deadline {new Date(project.deadline).toLocaleString()}
          </div>
        </div>
        <Link href="/campaigns">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Funding Progress</CardTitle>
          <CardDescription>
            {fmt.format(currentAmount)} raised of {fmt.format(project.goal_amount)} goal ({progress}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full bg-muted rounded-full h-3">
            <div className="bg-gradient-to-r from-green-500 to-primary h-3 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => launchMutation.mutate()} disabled={launchMutation.isPending || project.state === "live"} className="h-11">
              Launch
            </Button>
            <Button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending || project.state !== "live"} variant="outline" className="h-11">
              Close (force)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Test a Pledge</CardTitle>
          <CardDescription>
            KIA pledges become <span className="font-semibold">paid</span> immediately. AON/Milestone pledges stay{" "}
            <span className="font-semibold">pending</span> until the campaign closes successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <Button onClick={() => pledgeMutation.mutate()} disabled={pledgeMutation.isPending} className="h-11">
            {pledgeMutation.isPending ? "Pledging..." : "Pledge"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Lightweight community thread (dev mode: provide user_id).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CommentComposer
              projectId={project.id}
              onPosted={async () => {
                await queryClient.invalidateQueries({ queryKey: ["comments", project.id] })
              }}
            />
            <div className="space-y-3">
              {(commentsQuery.data ?? []).slice().reverse().map((c) => (
                <div key={c.id} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    {c.user_id} · {new Date(c.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{c.body}</div>
                </div>
              ))}
              {commentsQuery.isLoading ? <div className="text-sm text-muted-foreground">Loading comments...</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Updates</CardTitle>
            <CardDescription>Creator updates feed (dev mode).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UpdateComposer
              projectId={project.id}
              onPosted={async () => {
                await queryClient.invalidateQueries({ queryKey: ["updates", project.id] })
              }}
            />
            <div className="space-y-3">
              {(updatesQuery.data ?? []).map((u) => (
                <div key={u.id} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">{new Date(u.created_at).toLocaleString()}</div>
                  <div className="font-semibold">{u.title}</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{u.body_md}</div>
                </div>
              ))}
              {updatesQuery.isLoading ? <div className="text-sm text-muted-foreground">Loading updates...</div> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CommentComposer({
  projectId,
  onPosted,
}: {
  projectId: string
  onPosted: () => Promise<void>
}) {
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null)
      if (!body.trim()) throw new Error("body is required")
      return createComment(projectId, { body: body.trim() })
    },
    onSuccess: async () => {
      setBody("")
      await onPosted()
    },
    onError: (e: any) => setError(e?.message || "Failed to post comment"),
  })

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="space-y-2">
        <Label>Comment</Label>
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment..." />
      </div>
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-10">
        {mutation.isPending ? "Posting..." : "Post"}
      </Button>
    </div>
  )
}

function UpdateComposer({ projectId, onPosted }: { projectId: string; onPosted: () => Promise<void> }) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      setError(null)
      if (!title.trim()) throw new Error("title is required")
      if (!body.trim()) throw new Error("body is required")
      return createUpdate(projectId, { title: title.trim(), body_md: body.trim(), published: true })
    },
    onSuccess: async () => {
      setTitle("")
      setBody("")
      await onPosted()
    },
    onError: (e: any) => setError(e?.message || "Failed to post update"),
  })

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Update title" />
        </div>
        <div className="space-y-2">
          <Label>Body (Markdown)</Label>
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="What changed?" />
        </div>
      </div>
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="h-10" variant="outline">
        {mutation.isPending ? "Publishing..." : "Publish Update"}
      </Button>
    </div>
  )
}
