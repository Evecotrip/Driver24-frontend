"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getPendingDrivers, 
  getVerifiedDrivers, 
  bulkVerifyDrivers,
  getDashboardOverview,
  getBookingAnalytics,
  getUserAnalytics,
  getDriverAnalytics
} from "@/lib/api"
import { store } from "@/lib/store"

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-black/60 dark:text-white/60">
            Analytics and system overview
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 overflow-x-auto">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveTab("bookings")}
          >
            📅 Bookings
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            👥 Users
          </Button>
          <Button
            variant={activeTab === "drivers" ? "default" : "outline"}
            onClick={() => setActiveTab("drivers")}
          >
            🚗 Drivers
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && dashboardData && (
          <div className="space-y-6">
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
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Verified: {dashboardData.stats.verifiedDrivers}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    Pending: {dashboardData.stats.pendingVerification}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Bookings</CardDescription>
                  <CardTitle className="text-3xl">{dashboardData.stats.totalBookings}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    Pending: {dashboardData.stats.pendingBookings}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Accepted: {dashboardData.stats.acceptedBookings}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>System Status</CardDescription>
                  <CardTitle className="text-lg text-green-600">✓ Operational</CardTitle>
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
                  <div className="space-y-3">
                    {dashboardData.recentActivity.bookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{booking.driver.name}</p>
                          <p className="text-sm text-black/60 dark:text-white/60">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          booking.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                          "bg-red-100 text-red-700"
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
                  <div className="space-y-3">
                    {dashboardData.recentActivity.users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-black/60 dark:text-white/60">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
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
          <div className="space-y-6">
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
                    <div key={status} className="flex justify-between text-sm">
                      <span>{status}:</span>
                      <span className="font-medium">{count}</span>
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
                <div className="space-y-3">
                  {bookingAnalytics.topDrivers.slice(0, 10).map((item: any, index: number) => (
                    <div key={item.driver?.id || index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{item.driver?.name || "Unknown"}</p>
                        <p className="text-sm text-black/60 dark:text-white/60">{item.driver?.city || "N/A"}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
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
          <div className="space-y-6">
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
                    <div key={role} className="flex justify-between text-sm">
                      <span>{role}:</span>
                      <span className="font-medium">{count}</span>
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
                <div className="space-y-3">
                  {userAnalytics.activeUsers.slice(0, 10).map((item: any, index: number) => (
                    <div key={item.user?.id || index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{item.user?.email || "Unknown"}</p>
                        <p className="text-sm text-black/60 dark:text-white/60">
                          {item.user?.firstName} {item.user?.lastName}
                        </p>
                      </div>
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
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
          <div className="space-y-6">
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
                  <CardTitle className="text-3xl text-green-600">{driverAnalytics.overview.verifiedDrivers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Available</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">{driverAnalytics.overview.availableDrivers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-3xl text-yellow-600">{driverAnalytics.overview.pendingVerification}</CardTitle>
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
                        <span className="text-sm">{item.city}</span>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
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
                        <span className="text-sm">{item.vehicleType}</span>
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
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
                <div className="space-y-3">
                  {driverAnalytics.topPerformers.slice(0, 10).map((item: any, index: number) => (
                    <div key={item.driver?.id || index} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{item.driver?.name || "Unknown"}</p>
                        <p className="text-sm text-black/60 dark:text-white/60">{item.driver?.city || "N/A"}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
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
