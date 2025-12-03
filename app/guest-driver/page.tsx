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
  const totalSteps = 6 // Personal Info, DL, PAN, Aadhar, Address, Experience
  
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
    firstName: "",
    lastName: "",
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
    if (!formData.email || !formData.phoneNumber || !formData.firstName || !formData.lastName) {
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
    
    // First name validation (at least 2 characters, only letters)
    if (formData.firstName.trim().length < 2) {
      setError("First name must be at least 2 characters long")
      return false
    }
    if (!/^[a-zA-Z]+$/.test(formData.firstName.trim())) {
      setError("First name should only contain letters")
      return false
    }
    
    // Last name validation (at least 2 characters, only letters)
    if (formData.lastName.trim().length < 2) {
      setError("Last name must be at least 2 characters long")
      return false
    }
    if (!/^[a-zA-Z]+$/.test(formData.lastName.trim())) {
      setError("Last name should only contain letters")
      return false
    }
    
    return true
  }

  // Removed validateStep2 - now handled in handleNext for each document step

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
    
    // Step 1: Personal Info
    if (currentStep === 1 && !validateStep1()) return
    
    // Step 2: DL Document
    if (currentStep === 2) {
      if (!formData.dlNumber) {
        setError("Please enter your DL number")
        return
      }
      const dlRegex = /^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$/
      if (!dlRegex.test(formData.dlNumber.toUpperCase())) {
        setError("Please enter a valid DL number (e.g., MH01-20230001234)")
        return
      }
      if (!files.dlImage) {
        setError("Please upload your DL image")
        return
      }
    }
    
    // Step 3: PAN Document
    if (currentStep === 3) {
      if (!formData.panNumber) {
        setError("Please enter your PAN number")
        return
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(formData.panNumber.toUpperCase())) {
        setError("Please enter a valid PAN number (e.g., ABCDE1234F)")
        return
      }
    }
    
    // Step 4: Aadhar Document
    if (currentStep === 4) {
      if (!formData.aadharNumber) {
        setError("Please enter your Aadhar number")
        return
      }
      const cleanAadhar = formData.aadharNumber.replace(/[\s\-]/g, '')
      const aadharRegex = /^\d{12}$/
      if (!aadharRegex.test(cleanAadhar)) {
        setError("Please enter a valid 12-digit Aadhar number")
        return
      }
    }
    
    // Step 5: Address
    if (currentStep === 5 && !validateStep3()) return
    
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setError("")
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only submit if on final step
    if (currentStep !== totalSteps) {
      handleNext()
      return
    }
    
    // Final validation before submit
    if (!validateStep1() || !validateStep3()) {
      return
    }

    // Validate DL
    if (!formData.dlNumber || !files.dlImage) {
      setError("DL number and image are required")
      return
    }
    
    // Validate PAN
    if (!formData.panNumber) {
      setError("PAN number is required")
      return
    }
    
    // Validate Aadhar
    if (!formData.aadharNumber) {
      setError("Aadhar number is required")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Combine first name and last name
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
      
      // Create API payload with combined name
      const apiData = {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        name: fullName,
        dlNumber: formData.dlNumber,
        panNumber: formData.panNumber,
        aadharNumber: formData.aadharNumber,
        permanentAddress: formData.permanentAddress,
        operatingAddress: formData.operatingAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        experience: formData.experience,
        salaryExpectation: formData.salaryExpectation,
      }
      
      const response = await registerGuestDriverWithFiles(apiData, files)

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
            {[1, 2, 3, 4, 5, 6].map((step) => (
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
          <div className="mb-8 grid grid-cols-6 gap-1 text-center text-xs text-muted-foreground">
            <div className={currentStep === 1 ? "text-primary font-medium" : ""}>Personal</div>
            <div className={currentStep === 2 ? "text-primary font-medium" : ""}>DL</div>
            <div className={currentStep === 3 ? "text-primary font-medium" : ""}>PAN</div>
            <div className={currentStep === 4 ? "text-primary font-medium" : ""}>Aadhar</div>
            <div className={currentStep === 5 ? "text-primary font-medium" : ""}>Address</div>
            <div className={currentStep === 6 ? "text-primary font-medium" : ""}>Experience</div>
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

          <form onSubmit={handleSubmit} onKeyDown={(e) => {
            // Prevent Enter key from submitting form except on final step
            if (e.key === 'Enter' && currentStep !== totalSteps) {
              e.preventDefault()
              handleNext()
            }
          }}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        First Name *
                      </label>
                      <Input
                        required
                        placeholder="Aryan"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Last Name *
                      </label>
                      <Input
                        required
                        placeholder="Agarwal"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                      />
                    </div>
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

            {/* Step 2: Driving License */}
            {currentStep === 2 && (
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader>
                  <CardTitle>Driving License</CardTitle>
                  <CardDescription>
                    Enter your DL number and upload a clear photo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      Format: XX##YYYYYYYYYYY (e.g., MH01-2023-0001234)
                    </p>
                  </div>
                  <FileUpload
                    label="DL Image *"
                    name="dlImage"
                    required
                    onChange={(file) => handleFileChange("dlImage", file)}
                    description="Upload a clear photo of your Driving License (JPEG, PNG, or PDF, max 5MB)"
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: PAN Card */}
            {currentStep === 3 && (
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader>
                  <CardTitle>PAN Card</CardTitle>
                  <CardDescription>
                    Enter your PAN number and optionally upload a photo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      PAN Number *
                    </label>
                    <Input
                      required
                      placeholder="ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Format: ABCDE1234F (5 letters + 4 digits + 1 letter)
                    </p>
                  </div>
                  <FileUpload
                    label="PAN Image (Optional)"
                    name="panImage"
                    onChange={(file) => handleFileChange("panImage", file)}
                    description="Upload a clear photo of your PAN card (JPEG, PNG, or PDF, max 5MB)"
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Aadhar Card */}
            {currentStep === 4 && (
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader>
                  <CardTitle>Aadhar Card</CardTitle>
                  <CardDescription>
                    Enter your Aadhar number and optionally upload a photo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Aadhar Number *
                    </label>
                    <Input
                      required
                      placeholder="1234-5678-9012"
                      value={formData.aadharNumber}
                      onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      12 digits (can include spaces or dashes)
                    </p>
                  </div>
                  <FileUpload
                    label="Aadhar Image (Optional)"
                    name="aadharImage"
                    onChange={(file) => handleFileChange("aadharImage", file)}
                    description="Upload a clear photo of your Aadhar card (JPEG, PNG, or PDF, max 5MB)"
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 5: Address Details */}
            {currentStep === 5 && (
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

            {/* Step 6: Experience & Salary */}
            {currentStep === 6 && (
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
              {currentStep < totalSteps ? (
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
              <li>You'll be redirected to complete authentication</li>
              <li>After authentication, your driver profile will be automatically created</li>
              <li>You can then access your driver dashboard immediately</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
