import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserByClerkId } from "@/lib/api"
import { store, UserData } from "@/lib/store"

export function useAuth() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      // Wait for Clerk to load
      if (!isLoaded) {
        return
      }

      // If no Clerk user, redirect to sign-in
      if (!user) {
        router.push("/sign-in")
        return
      }

      try {
        // Always fetch fresh data from backend (don't trust cached data)
        const response = await getUserByClerkId(user.id)
        
        if (response.success && response.data?.user?.role && response.data?.token) {
          // User exists in backend with a role
          const { user: freshUserData, token } = response.data
          
          // Update cache with fresh data and token
          setUserData(freshUserData as UserData)
          store.setUserData(freshUserData as UserData)
          store.setToken(token)
          setLoading(false)
        } else {
          // User exists in Clerk but hasn't selected a role yet
          // Redirect to role selection
          router.push("/select-role")
        }
      } catch (err) {
        console.error("Auth check error:", err)
        // If profile fetch fails, user probably needs to select a role
        router.push("/select-role")
      }
    }

    checkAuth()
  }, [user, isLoaded, router])

  return {
    user,
    userData,
    loading,
    error,
    isAuthenticated: !!user && !!userData,
  }
}
