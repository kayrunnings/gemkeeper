"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gem, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    try {
      if (isLogin) {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        // Sign up
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters")
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }

      // Redirect to dashboard on success
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Gem className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">ThoughtFolio</h1>
          <p className="text-muted-foreground mt-1">Thoughts that find you</p>
        </div>

        {/* Auth card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to access your gems"
                : "Sign up to start capturing wisdom"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "Your password" : "At least 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>{isLogin ? "Sign in" : "Create account"}</>
                )}
              </Button>
            </form>

            {/* Toggle between login and signup */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                }}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to keep your gems awesome.
        </p>
      </div>
    </div>
  )
}
