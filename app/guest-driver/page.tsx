"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { registerGuestDriverWithFiles } from "@/lib/api"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { FileUpload } from "@/components/ui/file-upload"

export default function GuestDriverRegistration() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  
  // File state
  const [files, setFiles] = useState<{
    dlImage: File | null
    panImage: File | null
    aadharImage: File | null
  }>({
    dlImage: null,
    panImage: null,
    aadharImage: null,
  })

  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    name: "",
    dlNumber: "",
    panNumber: "",
    aadharNumber: "",
    permanentAddress: "",
    operatingAddress: "",
    city: "",
    state: "",
    pincode: "",
    experience: undefined as number | undefined,
    salaryExpectation: undefined as number | undefined,
  })

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  
  const handleFileChange = (field: "dlImage" | "panImage" | "aadharImage", file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }))
  }

  const validateStep1 = () => {
    if (!formData.email || !formData.phoneNumber || !formData.name) {
      setError("Please fill in all required fields")
      return false
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    
    // Indian phone number validation (10 digits, starts with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/
    const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '') // Remove spaces, dashes, brackets
    if (!phoneRegex.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number (starting with 6-9)")
      return false
    }
    
    // Name validation (at least 2 characters, only letters and spaces)
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long")
      return false
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      setError("Name should only contain letters and spaces")
      return false
    }
    
    return true
  }

  const validateStep2 = () => {
    if (!formData.dlNumber || !formData.panNumber || !formData.aadharNumber) {
      setError("Please fill in all required document details")
      return false
    }
    
    // DL Number validation (Indian format: XX##-YYYYYYYYYYY or XX##YYYYYYYYYYY)
    // Format: State Code (2 letters) + RTO Code (2 digits) + Year (4 digits) + Serial (7 digits)
    const dlRegex = /^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$/
    if (!dlRegex.test(formData.dlNumber.toUpperCase())) {
      setError("Please enter a valid DL number (e.g., MH01-20230001234 or MH0120230001234)")
      return false
    }
    
    // PAN validation (Indian format: ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    if (!panRegex.test(formData.panNumber.toUpperCase())) {
      setError("Please enter a valid PAN number (e.g., ABCDE1234F)")
      return false
    }
    
    // Aadhar validation (12 digits, can have spaces or dashes)
    const cleanAadhar = formData.aadharNumber.replace(/[\s\-]/g, '')
    const aadharRegex = /^\d{12}$/
    if (!aadharRegex.test(cleanAadhar)) {
      setError("Please enter a valid 12-digit Aadhar number")
      return false
    }
    
    return true
  }

  const validateStep3 = () => {
    if (!formData.permanentAddress || !formData.operatingAddress || !formData.city) {
      setError("Please fill in all required address fields")
      return false
    }
    
    // Address validation (at least 10 characters)
    if (formData.permanentAddress.trim().length < 10) {
      setError("Permanent address must be at least 10 characters long")
      return false
    }
    if (formData.operatingAddress.trim().length < 10) {
      setError("Operating address must be at least 10 characters long")
      return false
    }
    
    // City validation (at least 2 characters, only letters and spaces)
    if (formData.city.trim().length < 2) {
      setError("City name must be at least 2 characters long")
      return false
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.city)) {
      setError("City name should only contain letters and spaces")
      return false
    }
    
    // Pincode validation (6 digits, optional)
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      setError("Please enter a valid 6-digit pincode")
      return false
    }
    
    // State validation (optional, but if provided should be valid)
    if (formData.state && formData.state.trim().length < 2) {
      setError("State name must be at least 2 characters long")
      return false
    }
    
    return true
  }

  const handleNext = () => {
    setError("")
    
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return
    if (currentStep === 3 && !validateStep3()) return
    
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setError("")
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return
    }

    // Validate at least DL image is provided
    if (!files.dlImage) {
      setError("DL image is required")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await registerGuestDriverWithFiles(formData, files)

      if (response.success && response.data) {
        setSuccess(response.message || "Registration details saved successfully!")
        
        // Store email for later use after Clerk auth
        localStorage.setItem("pendingDriverEmail", formData.email)
        
        // Redirect to Clerk sign-up with email hint after 2 seconds
        setTimeout(() => {
          router.push(`/sign-up?email=${encodeURIComponent(formData.email)}`)
        }, 2000)
      } else {
        setError(response.error || "Failed to save registration details")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Header */}
          <div className="mb-12 text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Guest Driver Registration
            </h1>
            <p className="text-lg text-muted-foreground">
              Fill in your details first, then complete authentication to activate your driver profile
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    currentStep >= step
                      ? "border-primary bg-primary text-white"
                      : "border-white/20 bg-white/5 text-muted-foreground"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 w-12 transition-all ${
                      currentStep > step ? "bg-primary" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="mb-8 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
            <div className={currentStep === 1 ? "text-primary font-medium" : ""}>Personal Info</div>
            <div className={currentStep === 2 ? "text-primary font-medium" : ""}>Documents</div>
            <div className={currentStep === 3 ? "text-primary font-medium" : ""}>Address</div>
            <div className={currentStep === 4 ? "text-primary font-medium" : ""}>Experience</div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-500 text-center animate-in fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-500 text-center animate-in fade-in">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Enter your basic contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Full Name *
                    </label>
                    <Input
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Email Address *
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      You'll use this email to sign in later
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Phone Number *
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder="+91-9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Document Information */}
            {currentStep === 2 && (
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader>
                  <CardTitle>Identity Documents</CardTitle>
                  <CardDescription>
                    Provide your DL, PAN, and Aadhar details for verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Driving License Number *
                      </label>
                      <Input
                        required
                        placeholder="MH0120230001234"
                        value={formData.dlNumber}
                        onChange={(e) => handleInputChange("dlNumber", e.target.value)}
                      />
                    </div>
                    <FileUpload
                      label="DL Image"
                      name="dlImage"
                      required
                      onChange={(file) => handleFileChange("dlImage", file)}
                      description="Upload your Driving License (JPEG, PNG, or PDF, max 5MB)"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        PAN Card Number *
                      </label>
                      <Input
                        required
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                      />
                    </div>
                    <FileUpload
                      label="PAN Image"
                      name="panImage"
                      onChange={(file) => handleFileChange("panImage", file)}
                      description="Upload your PAN Card (JPEG, PNG, or PDF, max 5MB)"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Aadhar Card Number *
                      </label>
                      <Input
                        required
                        placeholder="1234-5678-9012"
                        value={formData.aadharNumber}
                        onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
                      />
                    </div>
                    <FileUpload
                      label="Aadhar Image"
                      name="aadharImage"
                      onChange={(file) => handleFileChange("aadharImage", file)}
                      description="Upload your Aadhar Card (JPEG, PNG, or PDF, max 5MB)"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Address Information */}
            {currentStep === 3 && (
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader>
                  <CardTitle>Address Details</CardTitle>
                  <CardDescription>
                    Provide your permanent and operating addresses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Permanent Address *
                    </label>
                    <Input
                      required
                      placeholder="123 Main Street, Locality"
                      value={formData.permanentAddress}
                      onChange={(e) => handleInputChange("permanentAddress", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Operating Address *
                    </label>
                    <Input
                      required
                      placeholder="456 Work Street, Area"
                      value={formData.operatingAddress}
                      onChange={(e) => handleInputChange("operatingAddress", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        City *
                      </label>
                      <Input
                        required
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        State
                      </label>
                      <Input
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Pincode
                      </label>
                      <Input
                        placeholder="400001"
                        value={formData.pincode}
                        onChange={(e) => handleInputChange("pincode", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Experience & Salary */}
            {currentStep === 4 && (
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader>
                  <CardTitle>Experience & Salary Expectation</CardTitle>
                  <CardDescription>
                    Optional: Add your driving experience and salary expectations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Experience (years)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="5"
                        value={formData.experience || ""}
                        onChange={(e) => handleInputChange("experience", e.target.value ? parseInt(e.target.value) : "")}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Salary Expectation (₹/month)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="25000"
                        value={formData.salaryExpectation || ""}
                        onChange={(e) => handleInputChange("salaryExpectation", e.target.value ? parseInt(e.target.value) : "")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="glass"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 shadow-lg shadow-primary/20"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </div>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-400">
            <p className="font-medium mb-2">📋 What happens next?</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-300">
              <li>Your registration details will be saved securely</li>
              <li>You'll be redirected to complete authentication with Clerk</li>
              <li>After authentication, your driver profile will be automatically created</li>
              <li>You can then access your driver dashboard immediately</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
