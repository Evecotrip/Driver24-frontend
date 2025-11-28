"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { getDriverBookings, respondToBooking } from "@/lib/api"
import { store } from "@/lib/store"
import Link from "next/link"
import { AnimatedBackground } from "@/components/ui/animated-background"

interface Booking {
  id: string
  status: string
  pickupLocation?: string
  dropLocation?: string
  scheduledDate?: string
  notes?: string
  driverResponse?: string
  respondedAt?: string
  createdAt: string
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    profileImageUrl?: string
    city?: string
  }
}

export default function DriverRequestsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userData, setUserData] = useState(store.getUserData())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false)
  const [respondAction, setRespondAction] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED")
  const [driverResponse, setDriverResponse] = useState("")
  const [responding, setResponding] = useState(false)

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

    if (data.role !== "DRIVER") {
      router.push("/")
      return
    }

    loadBookings()
  }, [isLoaded, user, router])

  const loadBookings = async () => {
    setLoading(true)
    setError("")

    try {
      const token = store.getToken()
      if (!token) {
        router.push("/select-role")
        return
      }

      const response = await getDriverBookings(token)

      if (response.success && response.data) {
        setBookings(response.data)
      } else {
        setError(response.error || "Failed to fetch booking requests")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = (booking: Booking, action: "ACCEPTED" | "REJECTED") => {
    setSelectedBooking(booking)
    setRespondAction(action)
    setDriverResponse("")
    setIsRespondModalOpen(true)
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    setResponding(true)
    setError("")

    try {
      const token = store.getToken()
      if (!token) {
        router.push("/select-role")
        return
      }

      const response = await respondToBooking(
        token,
        selectedBooking.id,
        respondAction,
        driverResponse || undefined
      )

      if (response.success) {
        setSuccess(`Booking ${respondAction.toLowerCase()} successfully!`)
        setTimeout(() => setSuccess(""), 3000)
        setIsRespondModalOpen(false)
        setSelectedBooking(null)
        loadBookings()
      } else {
        setError(response.error || "Failed to respond to booking")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setResponding(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      ACCEPTED: "bg-green-500/10 text-green-500 border-green-500/20",
      REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
      CANCELLED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
      COMPLETED: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }

    return (
      <span className={`rounded-full px-3 py-1 text-xs font-medium border ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        {status}
      </span>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === "PENDING")
  const respondedBookings = bookings.filter(b => b.status !== "PENDING")

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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Booking Requests</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your booking requests from users
            </p>
          </div>
          <Link href="/dashboard/driver">
            <Button variant="outline" className="w-full sm:w-auto">← Back to Dashboard</Button>
          </Link>
        </div>

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-500 animate-in fade-in">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-500 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Pending Requests */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 text-sm border border-yellow-500/20">
              {pendingBookings.length}
            </span>
            Pending Requests
          </h2>
          {pendingBookings.length === 0 ? (
            <Card className="border-dashed border-white/10 bg-white/5">
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending booking requests
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingBookings.map((booking, index) => (
                <Card key={booking.id} className="border-l-4 border-l-yellow-500" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                          {booking.user.profileImageUrl ? (
                            <img
                              src={booking.user.profileImageUrl}
                              alt={booking.user.firstName || "User"}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold">
                              {(booking.user.firstName || booking.user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg bg-none text-foreground">
                            {booking.user.firstName && booking.user.lastName
                              ? `${booking.user.firstName} ${booking.user.lastName}`
                              : booking.user.email}
                          </CardTitle>
                          <CardDescription>{booking.user.city || "Location not specified"}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {booking.pickupLocation && (
                        <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                          <span className="block text-xs text-muted-foreground mb-1">Pickup</span>
                          <span className="font-medium text-foreground text-sm block truncate">
                            {booking.pickupLocation}
                          </span>
                        </div>
                      )}
                      {booking.dropLocation && (
                        <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                          <span className="block text-xs text-muted-foreground mb-1">Drop</span>
                          <span className="font-medium text-foreground text-sm block truncate">
                            {booking.dropLocation}
                          </span>
                        </div>
                      )}
                      {booking.scheduledDate && (
                        <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                          <span className="block text-xs text-muted-foreground mb-1">Scheduled</span>
                          <span className="font-medium text-foreground text-sm">
                            {new Date(booking.scheduledDate).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                        <span className="block text-xs text-muted-foreground mb-1">Requested</span>
                        <span className="font-medium text-foreground text-sm">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-muted-foreground mb-1">User's Notes:</p>
                        <p className="text-sm text-foreground">
                          {booking.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        variant="glass"
                        className="flex-1"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsModalOpen(true)
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRespond(booking, "ACCEPTED")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(booking, "REJECTED")}
                        className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Previous Responses */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white text-sm border border-white/20">
              {respondedBookings.length}
            </span>
            History
          </h2>
          {respondedBookings.length === 0 ? (
            <Card className="border-dashed border-white/10 bg-white/5">
              <CardContent className="py-8 text-center text-muted-foreground">
                No previous responses
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {respondedBookings.map((booking) => (
                <Card key={booking.id} className="opacity-80 hover:opacity-100 transition-opacity">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                          {booking.user.profileImageUrl ? (
                            <img
                              src={booking.user.profileImageUrl}
                              alt={booking.user.firstName || "User"}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold">
                              {(booking.user.firstName || booking.user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg bg-none text-foreground">
                            {booking.user.firstName && booking.user.lastName
                              ? `${booking.user.firstName} ${booking.user.lastName}`
                              : booking.user.email}
                          </CardTitle>
                          <CardDescription>{booking.user.city || "Location not specified"}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {booking.pickupLocation && (
                        <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                          <span className="block text-xs text-muted-foreground mb-1">Pickup</span>
                          <span className="font-medium text-foreground text-sm block truncate">
                            {booking.pickupLocation}
                          </span>
                        </div>
                      )}
                      {booking.dropLocation && (
                        <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                          <span className="block text-xs text-muted-foreground mb-1">Drop</span>
                          <span className="font-medium text-foreground text-sm block truncate">
                            {booking.dropLocation}
                          </span>
                        </div>
                      )}
                      {booking.respondedAt && (
                        <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                          <span className="block text-xs text-muted-foreground mb-1">Responded</span>
                          <span className="font-medium text-foreground text-sm">
                            {new Date(booking.respondedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {booking.driverResponse && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Your Response:</p>
                        <p className="text-sm text-foreground">
                          {booking.driverResponse}
                        </p>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="glass"
                      className="w-full"
                      onClick={() => {
                        setSelectedBooking(booking)
                        setIsModalOpen(true)
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
        }}
        title="Booking Details"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4 border-b border-white/10 pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                {selectedBooking.user.profileImageUrl ? (
                  <img
                    src={selectedBooking.user.profileImageUrl}
                    alt={selectedBooking.user.firstName || "User"}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {(selectedBooking.user.firstName || selectedBooking.user.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {selectedBooking.user.firstName && selectedBooking.user.lastName
                    ? `${selectedBooking.user.firstName} ${selectedBooking.user.lastName}`
                    : selectedBooking.user.email}
                </h3>
                <p className="text-muted-foreground">
                  {selectedBooking.user.email}
                </p>
                <div className="mt-2">
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground">Trip Details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedBooking.pickupLocation && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Pickup Location</p>
                    <p className="font-medium text-foreground mt-1">
                      {selectedBooking.pickupLocation}
                    </p>
                  </div>
                )}
                {selectedBooking.dropLocation && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Drop Location</p>
                    <p className="font-medium text-foreground mt-1">
                      {selectedBooking.dropLocation}
                    </p>
                  </div>
                )}
                {selectedBooking.scheduledDate && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium text-foreground mt-1">
                      {new Date(selectedBooking.scheduledDate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedBooking.notes && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">User's Notes</p>
                  <p className="font-medium text-foreground mt-1">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>

            {selectedBooking.driverResponse && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-muted-foreground">Your Response</p>
                <p className="mt-1 text-foreground">
                  {selectedBooking.driverResponse}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Respond Modal */}
      <Modal
        isOpen={isRespondModalOpen}
        onClose={() => {
          setIsRespondModalOpen(false)
          setSelectedBooking(null)
          setDriverResponse("")
        }}
        title={`${respondAction === "ACCEPTED" ? "Accept" : "Reject"} Booking Request`}
      >
        {selectedBooking && (
          <form onSubmit={handleSubmitResponse} className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p className="text-lg font-medium text-foreground">
                {selectedBooking.user.firstName && selectedBooking.user.lastName
                  ? `${selectedBooking.user.firstName} ${selectedBooking.user.lastName}`
                  : selectedBooking.user.email}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Message to User (Optional)
              </label>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                placeholder={
                  respondAction === "ACCEPTED"
                    ? "e.g., I'll be happy to help! Please call me at..."
                    : "e.g., Sorry, I'm not available at that time..."
                }
                value={driverResponse}
                onChange={(e) => setDriverResponse(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="glass"
                className="flex-1"
                onClick={() => {
                  setIsRespondModalOpen(false)
                  setSelectedBooking(null)
                }}
                disabled={responding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={`flex-1 shadow-lg ${respondAction === "ACCEPTED"
                    ? "bg-green-600 hover:bg-green-700 shadow-green-500/20"
                    : "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                  }`}
                disabled={responding}
              >
                {responding
                  ? "Sending..."
                  : respondAction === "ACCEPTED"
                    ? "Accept Request"
                    : "Reject Request"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
