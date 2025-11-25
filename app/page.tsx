"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { store } from "@/lib/store"
import { getUserByClerkId } from "@/lib/api"
import Link from "next/link"

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-black text-white shadow-2xl dark:bg-white dark:text-black">
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
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Driver Save
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-black/60 dark:text-white/60">
              Connect with verified professional drivers in your city or register as a driver to expand your opportunities
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border-2 border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
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
            <h3 className="mb-2 text-xl font-semibold">Find Drivers</h3>
            <p className="text-black/60 dark:text-white/60">
              Search and connect with verified drivers in your city
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Verified Profiles</h3>
            <p className="text-black/60 dark:text-white/60">
              All drivers are verified with proper documentation
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Secure Platform</h3>
            <p className="text-black/60 dark:text-white/60">
              Role-based access with secure authentication
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
