"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/api"
import { setTokens } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await login({ email, password })
      setTokens({ access_token: res.access_token, refresh_token: res.refresh_token })
      router.push("/campaigns")
    } catch (e: any) {
      setError(e?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Use your account to pledge, comment, and create projects (creator role).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex gap-3">
            <Button onClick={onSubmit} disabled={loading} className="h-11 px-6">
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

