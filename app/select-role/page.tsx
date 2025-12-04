"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { selectRole, getUserByClerkId } from "@/lib/api"
import { store } from "@/lib/store"
import { AnimatedBackground } from "@/components/ui/animated-background"

export default function SelectRolePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"USER" | "DRIVER" | null>(null)
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingRole, setCheckingRole] = useState(true)

  // Check if user already has a role on mount
  useEffect(() => {
    const checkExistingRole = async () => {
      if (!user?.id) {
        setCheckingRole(false)
        return
      }

      try {
        const response = await getUserByClerkId(user.id)
        console.log(response)
        
        if (response.success && response.data?.user?.role) {
          const userRole = response.data.user.role
          
          // If user has ADMIN role, redirect to admin dashboard
          if (userRole === "ADMIN") {
            if (response.data.token) {
              store.setToken(response.data.token)
              store.setUserData({
                id: response.data.user.id,
                clerkId: user.id,
                email: response.data.user.email,
                role: userRole,
                city: response.data.user.city || "",
              })
            }
            router.push("/dashboard/admin")
            return
          }
          
          // If user has USER role, redirect to user dashboard
          if (userRole === "USER") {
            if (response.data.token) {
              store.setToken(response.data.token)
              store.setUserData({
                id: response.data.user.id,
                clerkId: user.id,
                email: response.data.user.email,
                role: userRole,
                city: response.data.user.city || "",
              })
            }
            router.push("/dashboard/user")
            return
          }
          
          // If user has DRIVER role, redirect to driver dashboard
          if (userRole === "DRIVER") {
            if (response.data.token) {
              store.setToken(response.data.token)
              store.setUserData({
                id: response.data.user.id,
                clerkId: user.id,
                email: response.data.user.email,
                role: userRole,
                city: response.data.user.city || "",
              })
            }
            router.push("/dashboard/driver")
            return
          }
        }
      } catch (err) {
        console.error("Error checking user role:", err)
      } finally {
        setCheckingRole(false)
      }
    }

    if (isLoaded) {
      checkExistingRole()
    }
  }, [user?.id, isLoaded, router])

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
          clerkId: user.id,
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

  if (!isLoaded || checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/sign-in")
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <main className="container mx-auto px-4 py-32">
        <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-12 text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Select Your Role</h1>
            <p className="text-lg text-muted-foreground">
              Choose how you want to use Drivers24
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role Selection */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Card
                className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 ${selectedRole === "USER"
                  ? "ring-2 ring-primary border-primary/50 bg-primary/10 shadow-lg shadow-primary/20"
                  : "hover:bg-white/5"
                  }`}
                onClick={() => setSelectedRole("USER")}
              >
                <CardHeader>
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${selectedRole === "USER" ? "bg-primary text-white" : "bg-white/10 text-foreground"
                    }`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-7 w-7"
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
                className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 ${selectedRole === "DRIVER"
                  ? "ring-2 ring-secondary border-secondary/50 bg-secondary/10 shadow-lg shadow-secondary/20"
                  : "hover:bg-white/5"
                  }`}
                onClick={() => setSelectedRole("DRIVER")}
              >
                <CardHeader>
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${selectedRole === "DRIVER" ? "bg-secondary text-black" : "bg-white/10 text-foreground"
                    }`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-7 w-7"
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
            <div className={`transition-all duration-500 ${selectedRole ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
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
                    required={!!selectedRole}
                    className="h-12 text-lg"
                  />
                </CardContent>
              </Card>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-500 text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg shadow-xl shadow-primary/20"
              disabled={!selectedRole || !city || loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </div>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
