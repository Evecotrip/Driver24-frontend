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
import { AnimatedBackground } from "@/components/ui/animated-background"

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Driver Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your driver profile and availability
            </p>
          </div>
          {driverProfile && (
            <Link href="/dashboard/driver/requests">
              <Button variant="outline" className="w-full sm:w-auto">Booking Requests</Button>
            </Link>
          )}
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

        {/* Profile View */}
        {driverProfile && !showForm && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription className="mt-2">
                      {driverProfile.isVerified ? (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500 border border-green-500/20">
                          ✓ Verified Profile
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500 border border-yellow-500/20">
                          ⏳ Pending Verification
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(true)}
                    >
                      Edit Profile
                    </Button>

                    {/* Availability Switch */}
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                      <span className="text-sm font-medium text-muted-foreground">Availability:</span>
                      <button
                        onClick={handleAvailabilityToggle}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${driverProfile.availability
                            ? "bg-green-500"
                            : "bg-red-500"
                          }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${driverProfile.availability ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                      </button>
                      <span
                        className={`text-sm font-semibold ${driverProfile.availability
                            ? "text-green-500"
                            : "text-red-500"
                          }`}
                      >
                        {driverProfile.availability ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-medium text-foreground">{driverProfile.name}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-lg font-medium text-foreground">{driverProfile.phoneNumber}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-muted-foreground">City</p>
                  <p className="text-lg font-medium text-foreground">{driverProfile.city}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-muted-foreground">RC Number</p>
                  <p className="text-lg font-medium text-foreground">{driverProfile.rcNumber}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-muted-foreground">DL Number</p>
                  <p className="text-lg font-medium text-foreground">{driverProfile.dlNumber}</p>
                </div>
                {driverProfile.vehicleType && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-muted-foreground">Vehicle</p>
                    <p className="text-lg font-medium text-foreground">
                      {driverProfile.vehicleType}
                      {driverProfile.vehicleModel && ` - ${driverProfile.vehicleModel}`}
                    </p>
                  </div>
                )}
                {driverProfile.experience && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-medium text-muted-foreground">Experience</p>
                    <p className="text-lg font-medium text-foreground">{driverProfile.experience} years</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Form */}
        {showForm && (
          <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
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

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={saving} className="shadow-lg shadow-primary/20">
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                  {driverProfile && (
                    <Button
                      type="button"
                      variant="glass"
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
