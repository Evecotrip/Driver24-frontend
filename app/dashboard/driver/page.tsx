"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createDriverProfile, getMyDriverProfile, updateAvailability } from "@/lib/api"
import { store } from "@/lib/store"
import Link from "next/link"

interface DriverProfile {
  id: string
  name: string
  phoneNumber: string
  rcNumber: string
  rcImage?: string
  dlNumber: string
  dlImage?: string
  permanentAddress: string
  operatingAddress: string
  city: string
  state?: string
  pincode?: string
  vehicleType?: string
  vehicleModel?: string
  vehicleNumber?: string
  experience?: number
  salaryExpectation?: number
  availability: boolean
  isVerified: boolean
  verifiedAt?: string
}

export default function DriverDashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userData, setUserData] = useState(store.getUserData())
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    rcNumber: "",
    rcImage: "",
    dlNumber: "",
    dlImage: "",
    permanentAddress: "",
    operatingAddress: "",
    city: "",
    state: "",
    pincode: "",
    vehicleType: "",
    vehicleModel: "",
    vehicleNumber: "",
    experience: "",
    salaryExpectation: "",
  })

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

    loadDriverProfile()
  }, [isLoaded, user, router])

  const loadDriverProfile = async () => {
    try {
      const token = store.getToken()
      if (!token) {
        router.push("/select-role")
        return
      }

      const response = await getMyDriverProfile(token)
      
      if (response.success && response.data) {
        setDriverProfile(response.data)
        setFormData({
          name: response.data.name || "",
          phoneNumber: response.data.phoneNumber || "",
          rcNumber: response.data.rcNumber || "",
          rcImage: response.data.rcImage || "",
          dlNumber: response.data.dlNumber || "",
          dlImage: response.data.dlImage || "",
          permanentAddress: response.data.permanentAddress || "",
          operatingAddress: response.data.operatingAddress || "",
          city: response.data.city || "",
          state: response.data.state || "",
          pincode: response.data.pincode || "",
          vehicleType: response.data.vehicleType || "",
          vehicleModel: response.data.vehicleModel || "",
          vehicleNumber: response.data.vehicleNumber || "",
          experience: response.data.experience?.toString() || "",
          salaryExpectation: response.data.salaryExpectation?.toString() || "",
        })
      } else {
        // No profile yet
        setShowForm(true)
        const userData = store.getUserData()
        if (userData?.city) {
          setFormData((prev) => ({ ...prev, city: userData.city || "" }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const token = store.getToken()
      if (!token) {
        router.push("/select-role")
        return
      }

      const response = await createDriverProfile(token, {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        salaryExpectation: formData.salaryExpectation ? parseInt(formData.salaryExpectation) : undefined,
      })

      if (response.success) {
        setSuccess(response.message || "Profile saved successfully!")
        setShowForm(false)
        await loadDriverProfile()
      } else {
        setError(response.error || "Failed to save profile")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleAvailabilityToggle = async () => {
    if (!driverProfile) return

    try {
      const token = store.getToken()
      if (!token) return

      const response = await updateAvailability(token, !driverProfile.availability)

      if (response.success) {
        setDriverProfile({ ...driverProfile, availability: !driverProfile.availability })
        setSuccess("Availability updated!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(response.error || "Failed to update availability")
      }
    } catch (err) {
      setError("An error occurred")
      console.error(err)
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Driver Dashboard</h1>
            <p className="mt-2 text-black/60 dark:text-white/60">
              Manage your driver profile and availability
            </p>
          </div>
          {driverProfile && (
            <Link href="/dashboard/driver/requests">
              <Button variant="outline">Booking Requests</Button>
            </Link>
          )}
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

        {/* Profile View */}
        {driverProfile && !showForm && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>
                      {driverProfile.isVerified ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ Verified Profile
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          ⏳ Pending Verification
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(true)}
                    >
                      Edit Profile
                    </Button>
                    
                    {/* Availability Switch */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Availability:</span>
                      <button
                        onClick={handleAvailabilityToggle}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          driverProfile.availability
                            ? "bg-green-600 focus:ring-green-500"
                            : "bg-red-600 focus:ring-red-500"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            driverProfile.availability ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm font-semibold ${
                          driverProfile.availability
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {driverProfile.availability ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-black/60 dark:text-white/60">Name</p>
                  <p className="text-lg">{driverProfile.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black/60 dark:text-white/60">Phone</p>
                  <p className="text-lg">{driverProfile.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black/60 dark:text-white/60">City</p>
                  <p className="text-lg">{driverProfile.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black/60 dark:text-white/60">RC Number</p>
                  <p className="text-lg">{driverProfile.rcNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black/60 dark:text-white/60">DL Number</p>
                  <p className="text-lg">{driverProfile.dlNumber}</p>
                </div>
                {driverProfile.vehicleType && (
                  <div>
                    <p className="text-sm font-medium text-black/60 dark:text-white/60">Vehicle</p>
                    <p className="text-lg">
                      {driverProfile.vehicleType}
                      {driverProfile.vehicleModel && ` - ${driverProfile.vehicleModel}`}
                    </p>
                  </div>
                )}
                {driverProfile.experience && (
                  <div>
                    <p className="text-sm font-medium text-black/60 dark:text-white/60">Experience</p>
                    <p className="text-lg">{driverProfile.experience} years</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {driverProfile ? "Edit Profile" : "Create Your Driver Profile"}
              </CardTitle>
              <CardDescription>
                Fill in your details to create your driver profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Full Name *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Phone Number *
                    </label>
                    <Input
                      required
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      RC Number *
                    </label>
                    <Input
                      required
                      value={formData.rcNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, rcNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      DL Number *
                    </label>
                    <Input
                      required
                      value={formData.dlNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, dlNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Permanent Address *
                    </label>
                    <Input
                      required
                      value={formData.permanentAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, permanentAddress: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Operating Address *
                    </label>
                    <Input
                      required
                      value={formData.operatingAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, operatingAddress: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      City *
                    </label>
                    <Input
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      State *
                    </label>
                    <Input
                      required
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Pincode *
                    </label>
                    <Input
                      required
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                    />
                  </div>
                  {/*
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Vehicle Type
                    </label>
                    <Input
                      placeholder="e.g., Car, Bike, Auto"
                      value={formData.vehicleType}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleType: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Vehicle Model
                    </label>
                    <Input
                      placeholder="e.g., Honda City"
                      value={formData.vehicleModel}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleModel: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Vehicle Number
                    </label>
                    <Input
                      placeholder="e.g., MH01AB1234"
                      value={formData.vehicleNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleNumber: e.target.value })
                      }
                    />
                  </div>
                  */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Experience (years)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData({ ...formData, experience: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Salary Expectation (₹/month)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g., 25000"
                      value={formData.salaryExpectation}
                      onChange={(e) =>
                        setFormData({ ...formData, salaryExpectation: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                  {driverProfile && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
