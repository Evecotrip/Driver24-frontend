"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { getDriversByCity, createBooking, getUserBookings, getDriverFullInfo } from "@/lib/api"
import { store } from "@/lib/store"
import Link from "next/link"
import { AnimatedBackground } from "@/components/ui/animated-background"

interface Driver {
  id: string
  name: string
  phoneNumber: string
  city: string
  state?: string
  pincode?: string
  permanentAddress: string
  operatingAddress: string
  rcNumber: string
  rcImage?: string
  dlNumber: string
  dlImage?: string
  vehicleType?: string
  vehicleModel?: string
  vehicleNumber?: string
  experience?: number
  salaryExpectation?: number
  availability: boolean
  isVerified: boolean
  verifiedAt?: string
  createdAt?: string
  user: {
    email: string
    firstName?: string
    lastName?: string
    profileImageUrl?: string
  }
}

export default function UserDashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userData, setUserData] = useState(store.getUserData())
  const [searchCity, setSearchCity] = useState("")
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingDriver, setBookingDriver] = useState<Driver | null>(null)
  const [bookingForm, setBookingForm] = useState({
    pickupLocation: "",
    dropLocation: "",
    scheduledDate: "",
    notes: ""
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [minSalary, setMinSalary] = useState("")
  const [maxSalary, setMaxSalary] = useState("")
  const [minExperience, setMinExperience] = useState("")
  const [maxExperience, setMaxExperience] = useState("")

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

    // Auto-search in user's city
    if (data.city) {
      setSearchCity(data.city)
      handleSearch(data.city)
    }
  }, [isLoaded, user, router])

  const handleSearch = async (city?: string, page: number = 1) => {
    const cityToSearch = city || searchCity
    if (!cityToSearch) {
      setError("Please enter a city")
      return
    }

    setLoading(true)
    setError("")

    try {
      const token = store.getToken()
      if (!token) {
        setError("Please log in again")
        router.push("/select-role")
        return
      }

      const options: any = {
        page,
        limit: itemsPerPage
      }

      // Add filters if set
      if (minSalary) options.minSalary = parseInt(minSalary)
      if (maxSalary) options.maxSalary = parseInt(maxSalary)
      if (minExperience) options.minExperience = parseInt(minExperience)
      if (maxExperience) options.maxExperience = parseInt(maxExperience)

      const response = await getDriversByCity(token, cityToSearch, options)

      if (response.success && response.data) {
        setDrivers(response.data)
        setCurrentPage(page)

        if (response.pagination) {
          setTotalPages(response.pagination.totalPages)
          setTotalCount(response.pagination.totalCount)
        }

        if (response.data.length === 0) {
          setError(`No drivers found matching your criteria`)
        }
      } else {
        setError(response.error || "Failed to fetch drivers")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    handleSearch(searchCity, page)
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    handleSearch(searchCity, 1)
  }

  const handleClearFilters = () => {
    setMinSalary("")
    setMaxSalary("")
    setMinExperience("")
    setMaxExperience("")
    setCurrentPage(1)
    handleSearch(searchCity, 1)
  }

  const handleRequestDriver = (driver: Driver) => {
    setBookingDriver(driver)
    setIsBookingModalOpen(true)
    setBookingForm({
      pickupLocation: "",
      dropLocation: "",
      scheduledDate: "",
      notes: ""
    })
    setBookingSuccess("")
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingDriver) return

    setBookingLoading(true)
    setError("")

    try {
      const token = store.getToken()
      if (!token) {
        router.push("/select-role")
        return
      }

      const response = await createBooking(token, {
        driverId: bookingDriver.id,
        ...bookingForm
      })

      if (response.success) {
        setBookingSuccess("Booking request sent successfully!")
        setTimeout(() => {
          setIsBookingModalOpen(false)
          setBookingDriver(null)
        }, 2000)
      } else {
        setError(response.error || "Failed to send booking request")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setBookingLoading(false)
    }
  }

  if (!isLoaded || !userData) {
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Find Drivers</h1>
            <p className="mt-2 text-muted-foreground">
              Search for verified drivers in your city
            </p>
          </div>
          <Link href="/dashboard/user/bookings">
            <Button variant="outline" className="w-full sm:w-auto">My Bookings</Button>
          </Link>
        </div>

        {/* Search Section */}
        <Card className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <CardHeader>
            <CardTitle>Search by City</CardTitle>
            <CardDescription>
              Enter a city name to find available drivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                type="text"
                placeholder="Search here"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleSearch()} disabled={loading} className="flex-1 sm:flex-none">
                  {loading ? "Searching..." : "Search"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none"
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-semibold text-foreground">Filters</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Salary Range (₹/month)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minSalary}
                        onChange={(e) => setMinSalary(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxSalary}
                        onChange={(e) => setMaxSalary(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Experience (years)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minExperience}
                        onChange={(e) => setMinExperience(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxExperience}
                        onChange={(e) => setMaxExperience(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApplyFilters} disabled={loading}>
                    Apply Filters
                  </Button>
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && !drivers.length && (
          <div className="mb-8 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-500 text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Results Summary */}
        {drivers.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {drivers.length} of {totalCount} drivers (Page {currentPage} of {totalPages})
          </div>
        )}

        {/* Drivers Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver, index) => (
            <Card key={driver.id} className="group overflow-hidden hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                      {driver.user.profileImageUrl ? (
                        <img
                          src={driver.user.profileImageUrl}
                          alt={driver.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold">
                          {driver.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-none text-white">{driver.name}</CardTitle>
                      <CardDescription>{driver.city}</CardDescription>
                    </div>
                  </div>
                  {driver.isVerified && (
                    <div className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 border border-green-500/20">
                      Verified
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {driver.salaryExpectation && (
                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                      <span className="block text-xs text-muted-foreground">Salary</span>
                      <span className="font-medium text-foreground">₹{driver.salaryExpectation}/mo</span>
                    </div>
                  )}
                  {driver.experience && (
                    <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                      <span className="block text-xs text-muted-foreground">Experience</span>
                      <span className="font-medium text-foreground">{driver.experience} years</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    variant="glass"
                    onClick={() => {
                      setSelectedDriver(driver)
                      setIsModalOpen(true)
                    }}
                  >
                    Details
                  </Button>
                  <Button
                    className="flex-1 shadow-lg shadow-primary/20"
                    size="sm"
                    onClick={() => handleRequestDriver(driver)}
                  >
                    Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {drivers.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-8 w-8 text-muted-foreground"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground">No drivers found</h3>
            <p className="text-muted-foreground mt-2">Try searching for a different city or adjusting filters</p>
          </div>
        )}

        {/* Pagination Controls */}
        {drivers.length > 0 && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  )
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2 text-muted-foreground self-end pb-2">...</span>
                }
                return null
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Driver Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDriver(null)
        }}
        title="Driver Details"
      >
        {selectedDriver && (
          <div className="space-y-6">
            {/* Driver Header */}
            <div className="flex items-center space-x-4 border-b border-white/10 pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                {selectedDriver.user.profileImageUrl ? (
                  <img
                    src={selectedDriver.user.profileImageUrl}
                    alt={selectedDriver.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold">
                    {selectedDriver.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground">{selectedDriver.name}</h3>
                <p className="text-muted-foreground">
                  {selectedDriver.city}
                  {selectedDriver.state && `, ${selectedDriver.state}`}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {selectedDriver.isVerified && (
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500 border border-green-500/20">
                      ✓ Verified Driver
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${selectedDriver.availability
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                  >
                    {selectedDriver.availability ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            {(selectedDriver.vehicleType || selectedDriver.vehicleModel || selectedDriver.vehicleNumber) && (
              <div>
                <h4 className="mb-3 text-lg font-semibold text-foreground">Basic Information</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedDriver.experience && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium text-foreground">{selectedDriver.experience} years</p>
                    </div>
                  )}
                  {selectedDriver.salaryExpectation && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-muted-foreground">Salary Expectation</p>
                      <p className="font-medium text-foreground">₹{selectedDriver.salaryExpectation.toLocaleString('en-IN')}/month</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* License Information */}
            <div>
              <h4 className="mb-3 text-lg font-semibold text-foreground">License & Registration</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">RC Number</p>
                  <p className="font-medium text-foreground">{selectedDriver.rcNumber ? selectedDriver.rcNumber.slice(0, 5) + "..." : "Not provided"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">DL Number</p>
                  <p className="font-medium text-foreground">{selectedDriver.dlNumber ? selectedDriver.dlNumber.slice(0, 5) + "..." : "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="mb-3 text-lg font-semibold text-foreground">Address</h4>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Operating Address</p>
                  <p className="font-medium text-foreground">{selectedDriver.operatingAddress}</p>
                  {selectedDriver.pincode && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pincode: {selectedDriver.pincode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-white/10 pt-6">
              <Button
                className="flex-1 shadow-lg shadow-primary/20"
                onClick={() => window.open(`tel:${selectedDriver.phoneNumber}`)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call Driver
              </Button>
              <Button
                variant="glass"
                className="flex-1"
                onClick={() => window.open(`mailto:${selectedDriver.user.email}`)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Send Email
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Booking Request Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setBookingDriver(null)
          setBookingSuccess("")
        }}
        title="Request Driver"
      >
        {bookingDriver && (
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20">
                  {bookingDriver.user.profileImageUrl ? (
                    <img
                      src={bookingDriver.user.profileImageUrl}
                      alt={bookingDriver.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold">
                      {bookingDriver.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{bookingDriver.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingDriver.city}
                  </p>
                </div>
              </div>
            </div>

            {bookingSuccess && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-green-500">
                {bookingSuccess}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-500">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Pickup Location (Optional)
              </label>
              <Input
                type="text"
                placeholder="Enter pickup location"
                value={bookingForm.pickupLocation}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, pickupLocation: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Drop Location (Optional)
              </label>
              <Input
                type="text"
                placeholder="Enter drop location"
                value={bookingForm.dropLocation}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, dropLocation: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Scheduled Date (Optional)
              </label>
              <Input
                type="datetime-local"
                value={bookingForm.scheduledDate}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, scheduledDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Additional Notes (Optional)
              </label>
              <textarea
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                placeholder="Any special requirements or notes..."
                value={bookingForm.notes}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, notes: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="glass"
                className="flex-1"
                onClick={() => {
                  setIsBookingModalOpen(false)
                  setBookingDriver(null)
                }}
                disabled={bookingLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 shadow-lg shadow-primary/20"
                disabled={bookingLoading}
              >
                {bookingLoading ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
