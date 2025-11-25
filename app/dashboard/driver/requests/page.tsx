"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { getDriverBookings, respondToBooking } from "@/lib/api"
import { store } from "@/lib/store"
import Link from "next/link"

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
      PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
      COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
    }

    return (
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        {status}
      </span>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === "PENDING")
  const respondedBookings = bookings.filter(b => b.status !== "PENDING")

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Booking Requests</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Manage your booking requests from users
            </p>
          </div>
          <Link href="/dashboard/driver">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {success && (
          <div className="mb-6 rounded-lg border-2 border-green-500 bg-green-50 p-4 text-green-700 dark:bg-green-950 dark:text-green-300">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">
            Pending Requests ({pendingBookings.length})
          </h2>
          {pendingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-black/60 dark:text-white/60">
                No pending booking requests
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className="border-2 border-yellow-200 dark:border-yellow-900">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                          {booking.user.profileImageUrl ? (
                            <img
                              src={booking.user.profileImageUrl}
                              alt={booking.user.firstName || "User"}
                              className="h-12 w-12 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-semibold">
                              {(booking.user.firstName || booking.user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <CardTitle>
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
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {booking.pickupLocation && (
                        <div className="text-sm">
                          <span className="font-medium">Pickup:</span>
                          <span className="ml-2 text-black/60 dark:text-white/60">
                            {booking.pickupLocation}
                          </span>
                        </div>
                      )}
                      {booking.dropLocation && (
                        <div className="text-sm">
                          <span className="font-medium">Drop:</span>
                          <span className="ml-2 text-black/60 dark:text-white/60">
                            {booking.dropLocation}
                          </span>
                        </div>
                      )}
                      {booking.scheduledDate && (
                        <div className="text-sm">
                          <span className="font-medium">Scheduled:</span>
                          <span className="ml-2 text-black/60 dark:text-white/60">
                            {new Date(booking.scheduledDate).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Requested:</span>
                        <span className="ml-2 text-black/60 dark:text-white/60">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                        <p className="text-sm font-medium">User's Notes:</p>
                        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                          {booking.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsModalOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRespond(booking, "ACCEPTED")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(booking, "REJECTED")}
                        className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
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
        <div>
          <h2 className="mb-4 text-2xl font-bold">
            Previous Responses ({respondedBookings.length})
          </h2>
          {respondedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-black/60 dark:text-white/60">
                No previous responses
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {respondedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                          {booking.user.profileImageUrl ? (
                            <img
                              src={booking.user.profileImageUrl}
                              alt={booking.user.firstName || "User"}
                              className="h-12 w-12 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-semibold">
                              {(booking.user.firstName || booking.user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <CardTitle>
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
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {booking.pickupLocation && (
                        <div className="text-sm">
                          <span className="font-medium">Pickup:</span>
                          <span className="ml-2 text-black/60 dark:text-white/60">
                            {booking.pickupLocation}
                          </span>
                        </div>
                      )}
                      {booking.dropLocation && (
                        <div className="text-sm">
                          <span className="font-medium">Drop:</span>
                          <span className="ml-2 text-black/60 dark:text-white/60">
                            {booking.dropLocation}
                          </span>
                        </div>
                      )}
                      {booking.respondedAt && (
                        <div className="text-sm">
                          <span className="font-medium">Responded:</span>
                          <span className="ml-2 text-black/60 dark:text-white/60">
                            {new Date(booking.respondedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {booking.driverResponse && (
                      <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                        <p className="text-sm font-medium">Your Response:</p>
                        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                          {booking.driverResponse}
                        </p>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
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
          <div className="space-y-4">
            {/* User Info */}
            <div className="rounded-lg border-2 border-black/10 p-4 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                  {selectedBooking.user.profileImageUrl ? (
                    <img
                      src={selectedBooking.user.profileImageUrl}
                      alt={selectedBooking.user.firstName || "User"}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {(selectedBooking.user.firstName || selectedBooking.user.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {selectedBooking.user.firstName && selectedBooking.user.lastName
                      ? `${selectedBooking.user.firstName} ${selectedBooking.user.lastName}`
                      : selectedBooking.user.email}
                  </p>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    {selectedBooking.user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="mb-2 text-sm font-medium">Status</p>
              {getStatusBadge(selectedBooking.status)}
            </div>

            {/* Booking Details */}
            <div className="space-y-3">
              {selectedBooking.pickupLocation && (
                <div>
                  <p className="text-sm font-medium">Pickup Location</p>
                  <p className="text-black/60 dark:text-white/60">
                    {selectedBooking.pickupLocation}
                  </p>
                </div>
              )}
              {selectedBooking.dropLocation && (
                <div>
                  <p className="text-sm font-medium">Drop Location</p>
                  <p className="text-black/60 dark:text-white/60">
                    {selectedBooking.dropLocation}
                  </p>
                </div>
              )}
              {selectedBooking.scheduledDate && (
                <div>
                  <p className="text-sm font-medium">Scheduled Date</p>
                  <p className="text-black/60 dark:text-white/60">
                    {new Date(selectedBooking.scheduledDate).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm font-medium">User's Notes</p>
                  <p className="text-black/60 dark:text-white/60">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>

            {selectedBooking.driverResponse && (
              <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                <p className="text-sm font-medium">Your Response</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
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
          <form onSubmit={handleSubmitResponse} className="space-y-4">
            <div className="rounded-lg border-2 border-black/10 p-4 dark:border-white/10">
              <p className="text-sm font-medium">User</p>
              <p className="text-black/60 dark:text-white/60">
                {selectedBooking.user.firstName && selectedBooking.user.lastName
                  ? `${selectedBooking.user.firstName} ${selectedBooking.user.lastName}`
                  : selectedBooking.user.email}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Message to User (Optional)
              </label>
              <textarea
                className="w-full rounded-md border-2 border-black/10 p-2 dark:border-white/10 dark:bg-black"
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
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
                className={`flex-1 ${
                  respondAction === "ACCEPTED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
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
