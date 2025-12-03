"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { store } from "@/lib/store"
import { getUserByClerkId } from "@/lib/api"
import Link from "next/link"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Card } from "@/components/ui/card"

export default function Home() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userData, setUserData] = useState(store.getUserData())

  useEffect(() => {
    async function checkAndRedirect() {
      store.init()

      if (!isLoaded) return

      if (!user) {
        // Not logged in, stay on landing page
        return
      }

      try {
        // Always check backend for latest role (don't trust cached data)
        const response = await getUserByClerkId(user.id)

        if (response.success && response.data?.user?.role && response.data?.token) {
          // User has a role in backend
          const { user: userData, token } = response.data

          // Update localStorage with fresh data and token
          store.setUserData(userData as any)
          store.setToken(token)

          // Redirect to appropriate dashboard (role is guaranteed to be non-null here)
          redirectToDashboard(userData.role!)
        } else {
          // No role assigned, go to role selection
          router.push("/select-role")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        router.push("/select-role")
      }
    }

    function redirectToDashboard(role: string) {
      switch (role) {
        case "USER":
          router.push("/dashboard/user")
          break
        case "DRIVER":
          router.push("/dashboard/driver")
          break
        case "ADMIN":
          router.push("/dashboard/admin")
          break
        default:
          router.push("/select-role")
      }
    }

    checkAndRedirect()
  }, [user, isLoaded, router])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <main className="container mx-auto px-4 pt-32 pb-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-2xl shadow-primary/30 animate-[float_6s_ease-in-out_infinite]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
            <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl -z-10" />
          </div>

          <div className="space-y-6 max-w-4xl">
            <h1 className="text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent drop-shadow-sm">
              Drivers24
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground leading-relaxed">
              Connect with verified professional drivers in your city or register as a driver to expand your opportunities. <span className="text-primary font-medium">Premium service, guaranteed.</span>
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-10 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40">
                Get Started
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="glass" className="w-full sm:w-auto text-lg h-14 px-10 rounded-2xl">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Guest Driver Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Want to register as a driver?
            </p>
            <Link href="/guest-driver">
              <Button variant="outline" className="rounded-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-5 w-5"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                Register as Guest Driver
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group hover:-translate-y-2 transition-transform duration-300">
            <div className="p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
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
              <h3 className="mb-3 text-2xl font-bold text-foreground">Find Drivers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Search and connect with verified drivers in your city instantly.
              </p>
            </div>
          </Card>

          <Card className="group hover:-translate-y-2 transition-transform duration-300">
            <div className="p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-black transition-colors duration-300">
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Verified Profiles</h3>
              <p className="text-muted-foreground leading-relaxed">
                All drivers are strictly verified with proper documentation and background checks.
              </p>
            </div>
          </Card>

          <Card className="group hover:-translate-y-2 transition-transform duration-300">
            <div className="p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300">
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Secure Platform</h3>
              <p className="text-muted-foreground leading-relaxed">
                Role-based access with secure authentication and data protection.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
