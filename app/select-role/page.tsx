"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { selectRole } from "@/lib/api"
import { store } from "@/lib/store"

export default function SelectRolePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"USER" | "DRIVER" | null>(null)
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRole || !city || !user) {
      setError("Please select a role and enter your city")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await selectRole(user.id, selectedRole, city)
      
      if (response.success && response.data) {
        // Store JWT token and user data
        store.setToken(response.data.token)
        store.setUserData({
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role,
          city: response.data.user.city,
        })

        // Redirect based on role
        if (selectedRole === "USER") {
          router.push("/dashboard/user")
        } else if (selectedRole === "DRIVER") {
          router.push("/dashboard/driver")
        }
      } else {
        setError(response.error || "Failed to select role")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push("/sign-in")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold">Select Your Role</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Choose how you want to use Drivers24
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedRole === "USER"
                    ? "border-black ring-2 ring-black dark:border-white dark:ring-white"
                    : "hover:border-black/30 dark:hover:border-white/30"
                }`}
                onClick={() => setSelectedRole("USER")}
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <CardTitle>I'm a User</CardTitle>
                  <CardDescription>
                    Looking for drivers in my city
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedRole === "DRIVER"
                    ? "border-black ring-2 ring-black dark:border-white dark:ring-white"
                    : "hover:border-black/30 dark:hover:border-white/30"
                }`}
                onClick={() => setSelectedRole("DRIVER")}
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <path d="M9 17h6" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                  <CardTitle>I'm a Driver</CardTitle>
                  <CardDescription>
                    Want to create my driver profile
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* City Input */}
            {selectedRole && (
              <Card>
                <CardHeader>
                  <CardTitle>Enter Your City</CardTitle>
                  <CardDescription>
                    {selectedRole === "USER"
                      ? "We'll show you drivers available in your city"
                      : "This will be your operating city"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="e.g., Mumbai, Delhi, Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!selectedRole || !city || loading}
            >
              {loading ? "Processing..." : "Continue"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
