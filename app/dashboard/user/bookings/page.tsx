"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { getUserBookings, cancelBooking, getDriverFullInfo } from "@/lib/api"
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
  driver: {
    id: string
    name: string
    city: string
    vehicleType?: string
    vehicleModel?: string
    experience?: number
    salaryExpectation?: number
    user: {
      email: string
      firstName?: string
      lastName?: string
      profileImageUrl?: string
    }
  }
}

interface DriverFullInfo {
  id: string
  name: string
  phoneNumber: string
  city: string
  vehicleType?: string
  vehicleModel?: string
  vehicleNumber?: string
  experience?: number
  salaryExpectation?: number
  permanentAddress: string
  operatingAddress: string
  rcNumber: string
  dlNumber: string
  user: {
    email: string
    firstName?: string
    lastName?: string
  }
}

export default function UserBookingsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userData, setUserData] = useState(store.getUserData())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [driverFullInfo, setDriverFullInfo] = useState<DriverFullInfo | null>(null)
  const [loadingFullInfo, setLoadingFullInfo] = useState(false)

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

    if (data.role !== "USER") {
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

      const response = await getUserBookings(token)

      if (response.success && response.data) {
        setBookings(response.data)
      } else {
        setError(response.error || "Failed to fetch bookings")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const token = store.getToken()
      if (!token) return

      const response = await cancelBooking(token, bookingId)

      if (response.success) {
        setSuccess("Booking cancelled successfully")
        setTimeout(() => setSuccess(""), 3000)
        loadBookings()
      } else {
        setError(response.error || "Failed to cancel booking")
      }
    } catch (err) {
      setError("An error occurred")
      console.error(err)
    }
  }

  const handleViewDetails = async (booking: Booking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
    setDriverFullInfo(null)

    // If booking is accepted, fetch driver's full info including phone number
    if (booking.status === "ACCEPTED") {
      setLoadingFullInfo(true)
      try {
        const token = store.getToken()
        if (!token) return

        const response = await getDriverFullInfo(token, booking.driver.id)

        if (response.success && response.data) {
          setDriverFullInfo(response.data)
        }
      } catch (err) {
        console.error("Failed to fetch driver full info:", err)
      } finally {
        setLoadingFullInfo(false)
      }
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
            <h1 className="text-4xl font-bold">My Bookings</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Track your driver booking requests
            </p>
          </div>
          <Link href="/dashboard/user">
            <Button variant="outline">← Back to Search</Button>
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

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-black/60 dark:text-white/60">
                No bookings yet. Start by searching for drivers!
              </p>
              <Link href="/dashboard/user">
                <Button className="mt-4">Search Drivers</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                        {booking.driver.user.profileImageUrl ? (
                          <img
                            src={booking.driver.user.profileImageUrl}
                            alt={booking.driver.name}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <span className="text-lg font-semibold">
                            {booking.driver.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <CardTitle>{booking.driver.name}</CardTitle>
                        <CardDescription>{booking.driver.city}</CardDescription>
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

                  {booking.driverResponse && (
                    <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                      <p className="text-sm font-medium">Driver's Response:</p>
                      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                        {booking.driverResponse}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(booking)}
                    >
                      View Details
                    </Button>
                    {booking.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                    {booking.status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        onClick={() => handleViewDetails(booking)}
                      >
                        View Contact Info
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Booking Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
          setDriverFullInfo(null)
        }}
        title="Booking Details"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Driver Info */}
            <div className="rounded-lg border-2 border-black/10 p-4 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                  {selectedBooking.driver.user.profileImageUrl ? (
                    <img
                      src={selectedBooking.driver.user.profileImageUrl}
                      alt={selectedBooking.driver.name}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {selectedBooking.driver.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selectedBooking.driver.name}</p>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    {selectedBooking.driver.city}
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
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-black/60 dark:text-white/60">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Driver Response */}
            {selectedBooking.driverResponse && (
              <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                <p className="text-sm font-medium">Driver's Response</p>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  {selectedBooking.driverResponse}
                </p>
              </div>
            )}

            {/* Full Contact Info (Only for ACCEPTED bookings) */}
            {selectedBooking.status === "ACCEPTED" && (
              <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:bg-green-950">
                <h4 className="mb-3 font-semibold text-green-700 dark:text-green-300">
                  ✓ Booking Accepted - Contact Information
                </h4>
                {loadingFullInfo ? (
                  <p className="text-sm">Loading contact details...</p>
                ) : driverFullInfo ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Phone:</span>
                      <span className="ml-2">{driverFullInfo.phoneNumber}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{driverFullInfo.user.email}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Address:</span>
                      <span className="ml-2">{driverFullInfo.operatingAddress}</span>
                    </div>
                    {driverFullInfo.vehicleNumber && (
                      <div className="text-sm">
                        <span className="font-medium">Vehicle Number:</span>
                        <span className="ml-2">{driverFullInfo.vehicleNumber}</span>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(`tel:${driverFullInfo.phoneNumber}`)}
                      >
                        Call Driver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`mailto:${driverFullInfo.user.email}`)}
                      >
                        Send Email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">Failed to load contact details</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
