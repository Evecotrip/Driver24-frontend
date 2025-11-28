"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getDashboardOverview,
  getBookingAnalytics,
  getUserAnalytics,
  getDriverAnalytics
} from "@/lib/api"
import { store } from "@/lib/store"
import { AnimatedBackground } from "@/components/ui/animated-background"

export default function AdminDashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userData, setUserData] = useState(store.getUserData())
  const [activeTab, setActiveTab] = useState<"overview" | "drivers" | "bookings" | "users">("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Analytics state
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [bookingAnalytics, setBookingAnalytics] = useState<any>(null)
  const [userAnalytics, setUserAnalytics] = useState<any>(null)
  const [driverAnalytics, setDriverAnalytics] = useState<any>(null)

  useEffect(() => {
    store.init()
    const data = store.getUserData()
    setUserData(data)

    if (!isLoaded) return

    if (!user) {
      router.push("/sign-in")
      return
    }

    if (!data?.role) {
      router.push("/select-role")
      return
    }

    if (data.role !== "ADMIN") {
      router.push("/")
      return
    }

    loadData()
  }, [isLoaded, user, router, activeTab])

  const loadData = async () => {
    setLoading(true)
    setError("")

    try {
      const token = store.getToken()
      if (!token) {
        router.push("/select-role")
        return
      }

      if (activeTab === "overview") {
        const response = await getDashboardOverview(token)
        if (response.success) {
          setDashboardData(response.data)
        } else {
          setError(response.error || "Failed to load data")
        }
      } else if (activeTab === "bookings") {
        const response = await getBookingAnalytics(token)
        if (response.success) {
          setBookingAnalytics(response.data)
        } else {
          setError(response.error || "Failed to load booking analytics")
        }
      } else if (activeTab === "users") {
        const response = await getUserAnalytics(token)
        if (response.success) {
          setUserAnalytics(response.data)
        } else {
          setError(response.error || "Failed to load user analytics")
        }
      } else if (activeTab === "drivers") {
        const response = await getDriverAnalytics(token)
        if (response.success) {
          setDriverAnalytics(response.data)
        } else {
          setError(response.error || "Failed to load driver analytics")
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Analytics and system overview
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-500 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
          <Button
            variant={activeTab === "overview" ? "default" : "glass"}
            onClick={() => setActiveTab("overview")}
            className="whitespace-nowrap"
          >
            📊 Overview
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "glass"}
            onClick={() => setActiveTab("bookings")}
            className="whitespace-nowrap"
          >
            📅 Bookings
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "glass"}
            onClick={() => setActiveTab("users")}
            className="whitespace-nowrap"
          >
            👥 Users
          </Button>
          <Button
            variant={activeTab === "drivers" ? "default" : "glass"}
            onClick={() => setActiveTab("drivers")}
            className="whitespace-nowrap"
          >
            🚗 Drivers
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && dashboardData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl">{dashboardData.stats.totalUsers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Drivers</CardDescription>
                  <CardTitle className="text-3xl">{dashboardData.stats.totalDrivers}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Verified: <span className="text-green-500">{dashboardData.stats.verifiedDrivers}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pending: <span className="text-yellow-500">{dashboardData.stats.pendingVerification}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Bookings</CardDescription>
                  <CardTitle className="text-3xl">{dashboardData.stats.totalBookings}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Pending: <span className="text-yellow-500">{dashboardData.stats.pendingBookings}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Accepted: <span className="text-green-500">{dashboardData.stats.acceptedBookings}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>System Status</CardDescription>
                  <CardTitle className="text-lg text-green-500 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Operational
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.bookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{booking.driver.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${booking.status === "PENDING" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                            booking.status === "ACCEPTED" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                              "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500 border border-blue-500/20">
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Bookings Analytics Tab */}
        {activeTab === "bookings" && bookingAnalytics && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Bookings</CardDescription>
                  <CardTitle className="text-3xl">{bookingAnalytics.overview.totalBookings}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>This Month</CardDescription>
                  <CardTitle className="text-3xl">{bookingAnalytics.overview.bookingsThisMonth}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Today</CardDescription>
                  <CardTitle className="text-3xl">{bookingAnalytics.overview.bookingsToday}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>By Status</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(bookingAnalytics.overview.bookingsByStatus).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex justify-between text-sm mb-1 last:mb-0">
                      <span className="text-muted-foreground">{status}:</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingAnalytics.topDrivers.slice(0, 10).map((item: any, index: number) => (
                    <div key={item.driver?.id || index} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{item.driver?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{item.driver?.city || "N/A"}</p>
                      </div>
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-500 border border-blue-500/20">
                        {item.bookingCount} bookings
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Analytics Tab */}
        {activeTab === "users" && userAnalytics && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl">{userAnalytics.overview.totalUsers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>This Month</CardDescription>
                  <CardTitle className="text-3xl">{userAnalytics.overview.usersThisMonth}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Today</CardDescription>
                  <CardTitle className="text-3xl">{userAnalytics.overview.usersToday}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>By Role</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(userAnalytics.overview.usersByRole).map(([role, count]: [string, any]) => (
                    <div key={role} className="flex justify-between text-sm mb-1 last:mb-0">
                      <span className="text-muted-foreground">{role}:</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAnalytics.activeUsers.slice(0, 10).map((item: any, index: number) => (
                    <div key={item.user?.id || index} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{item.user?.email || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.user?.firstName} {item.user?.lastName}
                        </p>
                      </div>
                      <span className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-500 border border-purple-500/20">
                        {item.bookingCount} bookings
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Drivers Analytics Tab */}
        {activeTab === "drivers" && driverAnalytics && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Drivers</CardDescription>
                  <CardTitle className="text-3xl">{driverAnalytics.overview.totalDrivers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Verified</CardDescription>
                  <CardTitle className="text-3xl text-green-500">{driverAnalytics.overview.verifiedDrivers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Available</CardDescription>
                  <CardTitle className="text-3xl text-blue-500">{driverAnalytics.overview.availableDrivers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-3xl text-yellow-500">{driverAnalytics.overview.pendingVerification}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Drivers by City</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {driverAnalytics.driversByCity.slice(0, 10).map((item: any) => (
                      <div key={item.city} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{item.city}</span>
                        <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 border border-blue-500/20">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Drivers by Vehicle Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {driverAnalytics.driversByVehicle.map((item: any) => (
                      <div key={item.vehicleType} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{item.vehicleType}</span>
                        <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500 border border-purple-500/20">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Avg Salary Expectation</CardDescription>
                  <CardTitle className="text-2xl">
                    ₹{Math.round(driverAnalytics.overview.averageSalaryExpectation).toLocaleString('en-IN')}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Avg Experience</CardDescription>
                  <CardTitle className="text-2xl">
                    {driverAnalytics.overview.averageExperience.toFixed(1)} years
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Top Performers</CardDescription>
                  <CardTitle className="text-2xl">{driverAnalytics.topPerformers.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {driverAnalytics.topPerformers.slice(0, 10).map((item: any, index: number) => (
                    <div key={item.driver?.id || index} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{item.driver?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{item.driver?.city || "N/A"}</p>
                      </div>
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500 border border-green-500/20">
                        {item.acceptedBookings} accepted
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
