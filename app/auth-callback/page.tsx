"use client"

import { useUser, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { completeDriverRegistration } from "@/lib/api"
import { store } from "@/lib/store"
import { AnimatedBackground } from "@/components/ui/animated-background"

export default function AuthCallback() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "completing" | "success" | "error">("checking")
  const [message, setMessage] = useState("Checking for pending registration...")

  useEffect(() => {
    async function handleCallback() {
      if (!isLoaded) return

      if (!user) {
        router.push("/sign-in")
        return
      }

      // Check if there's a pending driver registration
      const pendingEmail = localStorage.getItem("pendingDriverEmail")

      if (!pendingEmail) {
        // No pending registration, proceed with normal flow
        router.push("/select-role")
        return
      }

      // Verify the email matches
      if (pendingEmail !== user.primaryEmailAddress?.emailAddress) {
        setStatus("error")
        setMessage("Email mismatch. Please sign in with the email you used for registration.")
        localStorage.removeItem("pendingDriverEmail")
        setTimeout(() => router.push("/sign-in"), 3000)
        return
      }

      // Complete the driver registration
      try {
        setStatus("completing")
        setMessage("Completing your driver registration...")

        // Get Clerk session token
        const clerkToken = await getToken()

        if (!clerkToken) {
          throw new Error("Failed to get authentication token")
        }

        // Complete registration with backend
        const response = await completeDriverRegistration(clerkToken, pendingEmail)

        if (response.success && response.data) {
          setStatus("success")
          setMessage("Registration completed successfully! Redirecting to dashboard...")

          // Store user data and custom JWT token
          store.setToken(response.data.token)
          store.setUserData({
            id: response.data.user.id,
            clerkId: user.id,
            email: response.data.user.email,
            role: response.data.user.role,
            city: response.data.user.city,
          })

          // Clean up pending email
          localStorage.removeItem("pendingDriverEmail")

          // Redirect to driver dashboard
          setTimeout(() => {
            router.push("/dashboard/driver")
          }, 2000)
        } else {
          throw new Error(response.error || "Failed to complete registration")
        }
      } catch (err) {
        console.error("Registration completion error:", err)
        setStatus("error")
        setMessage(
          err instanceof Error
            ? err.message
            : "Failed to complete registration. Please try again or contact support."
        )
        localStorage.removeItem("pendingDriverEmail")
        // Redirect to driver dashboard - the role is already set even if completion fails
        setTimeout(() => router.push("/dashboard/driver"), 3000)
      }
    }

    handleCallback()
  }, [user, isLoaded, router])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <main className="container mx-auto px-4 flex min-h-screen items-center justify-center">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === "checking" || status === "completing" ? (
              <div className="relative">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-primary/20"></div>
                </div>
              </div>
            ) : status === "success" ? (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border-4 border-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-green-500"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 border-4 border-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-10 w-10 text-red-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              {status === "checking" && "Checking Registration"}
              {status === "completing" && "Completing Registration"}
              {status === "success" && "Success!"}
              {status === "error" && "Error"}
            </h1>
            <p className="text-lg text-muted-foreground">{message}</p>
          </div>

          {/* Additional Info */}
          {status === "completing" && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-400">
              <p>Please wait while we set up your driver profile...</p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <p>You will be redirected shortly. If the issue persists, please contact support.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
