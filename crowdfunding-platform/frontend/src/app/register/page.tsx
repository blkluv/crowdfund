"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/lib/api"
import { setTokens } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("backer")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await register({ email, password, display_name: displayName, role })
      setTokens({ access_token: res.access_token, refresh_token: res.refresh_token })
      router.push("/campaigns")
    } catch (e: any) {
      setError(e?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Dev note: choosing creator/admin roles requires backend `DEV_MODE=true`. Otherwise you will be registered as a backer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="space-y-2">
            <Label>Role (dev)</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="backer">Backer</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex gap-3">
            <Button onClick={onSubmit} disabled={loading} className="h-11 px-6">
              {loading ? "Creating..." : "Create account"}
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

