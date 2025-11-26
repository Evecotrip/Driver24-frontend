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
            <h1 className="text-4xl font-bold">Find Drivers</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Search for verified drivers in your city
            </p>
          </div>
          <Link href="/dashboard/user/bookings">
            <Button variant="outline">My Bookings</Button>
          </Link>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search by City</CardTitle>
            <CardDescription>
              Enter a city name to find available drivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search here"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={() => handleSearch()} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="mt-6 space-y-4 rounded-lg border-2 border-black/10 p-4 dark:border-white/10">
                <h3 className="font-semibold">Filters</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
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
                    <label className="mb-2 block text-sm font-medium">
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
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && !drivers.length && (
          <div className="mb-8 rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
            {error}
          </div>
        )}

        {/* Results Summary */}
        {drivers.length > 0 && (
          <div className="mb-4 text-sm text-black/60 dark:text-white/60">
            Showing {drivers.length} of {totalCount} drivers (Page {currentPage} of {totalPages})
          </div>
        )}

        {/* Drivers Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <Card key={driver.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                      {driver.user.profileImageUrl ? (
                        <img
                          src={driver.user.profileImageUrl}
                          alt={driver.name}
                          className="h-12 w-12 rounded-full"
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {driver.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <CardDescription>{driver.city}</CardDescription>
                    </div>
                  </div>
                  {driver.isVerified && (
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      Verified
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {driver.salaryExpectation && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Salary:</span>
                    <span className="ml-2 text-black/60 dark:text-white/60">
                      {'₹' + driver?.salaryExpectation + '/month' || 'NA'}
                    </span>
                  </div>
                )}
                {driver.experience && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium">Experience:</span>
                    <span className="ml-2 text-black/60 dark:text-white/60">
                      {driver.experience} years
                    </span>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    className="flex-1" 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDriver(driver)
                      setIsModalOpen(true)
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleRequestDriver(driver)}
                  >
                    Request Driver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {drivers.length === 0 && !loading && !error && (
          <div className="text-center text-black/60 dark:text-white/60">
            Search for drivers in your city to get started
          </div>
        )}

        {/* Pagination Controls */}
        {drivers.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
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
                  return <span key={page} className="px-2">...</span>
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
            <div className="flex items-center space-x-4 border-b-2 border-black/10 pb-6 dark:border-white/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                {selectedDriver.user.profileImageUrl ? (
                  <img
                    src={selectedDriver.user.profileImageUrl}
                    alt={selectedDriver.name}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <span className="text-2xl font-semibold">
                    {selectedDriver.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{selectedDriver.name}</h3>
                <p className="text-black/60 dark:text-white/60">
                  {selectedDriver.city}
                  {selectedDriver.state && `, ${selectedDriver.state}`}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {selectedDriver.isVerified && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      ✓ Verified Driver
                    </span>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      selectedDriver.availability
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
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
                <h4 className="mb-3 text-lg font-semibold">Basic Information</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedDriver.experience && (
                    <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                      <p className="text-sm text-black/60 dark:text-white/60">Experience</p>
                      <p className="font-medium">{selectedDriver.experience} years</p>
                    </div>
                  )}
                  {selectedDriver.salaryExpectation && (
                    <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                      <p className="text-sm text-black/60 dark:text-white/60">Salary Expectation</p>
                      <p className="font-medium">₹{selectedDriver.salaryExpectation.toLocaleString('en-IN')}/month</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* License Information */}
            <div>
              <h4 className="mb-3 text-lg font-semibold">License & Registration</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                  <p className="text-sm text-black/60 dark:text-white/60">RC Number</p>
                  <p className="font-medium">{selectedDriver.rcNumber.slice(0, 5) + "..."}</p>
                </div>
                <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                  <p className="text-sm text-black/60 dark:text-white/60">DL Number</p>
                  <p className="font-medium">{selectedDriver.dlNumber.slice(0, 5) + "..."}</p>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="mb-3 text-lg font-semibold">Address</h4>
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-black/10 p-3 dark:border-white/10">
                  <p className="text-sm text-black/60 dark:text-white/60">Operating Address</p>
                  <p className="font-medium">{selectedDriver.operatingAddress}</p>
                  {selectedDriver.pincode && (
                    <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                      Pincode: {selectedDriver.pincode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t-2 border-black/10 pt-6 dark:border-white/10">
              <Button
                className="flex-1"
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
                variant="outline"
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
            <div className="rounded-lg border-2 border-black/10 p-4 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                  {bookingDriver.user.profileImageUrl ? (
                    <img
                      src={bookingDriver.user.profileImageUrl}
                      alt={bookingDriver.name}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {bookingDriver.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{bookingDriver.name}</p>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    {bookingDriver.city}
                  </p>
                </div>
              </div>
            </div>

            {bookingSuccess && (
              <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3 text-green-700 dark:bg-green-950 dark:text-green-300">
                {bookingSuccess}
              </div>
            )}

            {error && (
              <div className="rounded-lg border-2 border-red-500 bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
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
              <label className="mb-2 block text-sm font-medium">
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
              <label className="mb-2 block text-sm font-medium">
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
              <label className="mb-2 block text-sm font-medium">
                Additional Notes (Optional)
              </label>
              <textarea
                className="w-full rounded-md border-2 border-black/10 p-2 dark:border-white/10 dark:bg-black"
                rows={3}
                placeholder="Any special requirements or notes..."
                value={bookingForm.notes}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, notes: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
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
                className="flex-1"
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
