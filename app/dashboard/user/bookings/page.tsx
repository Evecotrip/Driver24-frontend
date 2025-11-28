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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">My Bookings</h1>
            <p className="mt-2 text-muted-foreground">
              Track your driver booking requests
            </p>
          </div>
          <Link href="/dashboard/user">
            <Button variant="outline" className="w-full sm:w-auto">← Back to Search</Button>
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

        {bookings.length === 0 ? (
          <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <CardContent className="py-12 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-lg text-muted-foreground">
                No bookings yet. Start by searching for drivers!
              </p>
              <Link href="/dashboard/user">
                <Button className="mt-6 shadow-lg shadow-primary/20">Search Drivers</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {bookings.map((booking, index) => (
              <Card key={booking.id} className="group overflow-hidden hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                        {booking.driver.user.profileImageUrl ? (
                          <img
                            src={booking.driver.user.profileImageUrl}
                            alt={booking.driver.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold">
                            {booking.driver.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg bg-none text-foreground">{booking.driver.name}</CardTitle>
                        <CardDescription>{booking.driver.city}</CardDescription>
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

                  {booking.driverResponse && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Driver's Response:</p>
                      <p className="text-sm text-foreground">
                        {booking.driverResponse}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="glass"
                      className="flex-1"
                      onClick={() => handleViewDetails(booking)}
                    >
                      View Details
                    </Button>
                    {booking.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                    {booking.status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        className="flex-1 shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleViewDetails(booking)}
                      >
                        Contact Info
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
            <div className="flex items-center space-x-4 border-b border-white/10 pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                {selectedBooking.driver.user.profileImageUrl ? (
                  <img
                    src={selectedBooking.driver.user.profileImageUrl}
                    alt={selectedBooking.driver.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {selectedBooking.driver.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedBooking.driver.name}</h3>
                <p className="text-muted-foreground">
                  {selectedBooking.driver.city}
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
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium text-foreground mt-1">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Driver Response */}
            {selectedBooking.driverResponse && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-muted-foreground">Driver's Response</p>
                <p className="mt-1 text-foreground">
                  {selectedBooking.driverResponse}
                </p>
              </div>
            )}

            {/* Full Contact Info (Only for ACCEPTED bookings) */}
            {selectedBooking.status === "ACCEPTED" && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                <h4 className="mb-4 font-semibold text-green-500 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  Booking Accepted - Contact Information
                </h4>
                {loadingFullInfo ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Loading contact details...
                  </div>
                ) : driverFullInfo ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-black/20 p-3">
                        <span className="block text-xs text-muted-foreground">Phone</span>
                        <span className="font-medium text-foreground">{driverFullInfo.phoneNumber}</span>
                      </div>
                      <div className="rounded-lg bg-black/20 p-3">
                        <span className="block text-xs text-muted-foreground">Email</span>
                        <span className="font-medium text-foreground">{driverFullInfo.user.email}</span>
                      </div>
                      <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                        <span className="block text-xs text-muted-foreground">Address</span>
                        <span className="font-medium text-foreground">{driverFullInfo.operatingAddress}</span>
                      </div>
                      {driverFullInfo.vehicleNumber && (
                        <div className="rounded-lg bg-black/20 p-3 sm:col-span-2">
                          <span className="block text-xs text-muted-foreground">Vehicle Number</span>
                          <span className="font-medium text-foreground">{driverFullInfo.vehicleNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 shadow-lg shadow-primary/20"
                        onClick={() => window.open(`tel:${driverFullInfo.phoneNumber}`)}
                      >
                        Call Driver
                      </Button>
                      <Button
                        variant="glass"
                        className="flex-1"
                        onClick={() => window.open(`mailto:${driverFullInfo.user.email}`)}
                      >
                        Send Email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-500">Failed to load contact details</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
