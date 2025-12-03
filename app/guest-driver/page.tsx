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

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case "email":
        if (!value) return "Email is required"
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return "Please enter a valid email address"
        return ""
      
      case "phoneNumber":
        if (!value) return "Phone number is required"
        const phoneRegex = /^[6-9]\d{9}$/
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '')
        if (!phoneRegex.test(cleanPhone)) return "Enter valid 10-digit number starting with 6-9"
        return ""
      
      case "firstName":
        if (!value) return "First name is required"
        if (value.trim().length < 2) return "First name must be at least 2 characters"
        if (!/^[a-zA-Z]+$/.test(value.trim())) return "First name should only contain letters"
        return ""
      
      case "lastName":
        if (!value) return "Last name is required"
        if (value.trim().length < 2) return "Last name must be at least 2 characters"
        if (!/^[a-zA-Z]+$/.test(value.trim())) return "Last name should only contain letters"
        return ""
      
      case "dlNumber":
        if (!value) return "DL number is required"
        const dlRegex = /^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$/
        if (!dlRegex.test(value.toUpperCase())) return "Invalid DL format (e.g., MH01-20230001234)"
        return ""
      
      case "panNumber":
        if (!value) return "PAN number is required"
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
        if (!panRegex.test(value.toUpperCase())) return "Invalid PAN format (e.g., ABCDE1234F)"
        return ""
      
      case "aadharNumber":
        if (!value) return "Aadhar number is required"
        const cleanAadhar = value.replace(/[\s\-]/g, '')
        const aadharRegex = /^\d{12}$/
        if (!aadharRegex.test(cleanAadhar)) return "Enter valid 12-digit Aadhar number"
        return ""
      
      case "permanentAddress":
        if (!value) return "Permanent address is required"
        if (value.trim().length < 10) return "Address must be at least 10 characters"
        return ""
      
      case "operatingAddress":
        if (!value) return "Operating address is required"
        if (value.trim().length < 10) return "Address must be at least 10 characters"
        return ""
      
      case "city":
        if (!value) return "City is required"
        if (value.trim().length < 2) return "City name must be at least 2 characters"
        if (!/^[a-zA-Z\s]+$/.test(value)) return "City should only contain letters and spaces"
        return ""
      
      case "state":
        if (!value) return "State is required"
        if (value.trim().length < 2) return "State name must be at least 2 characters"
        return ""
      
      case "pincode":
        if (!value) return "Pincode is required"
        if (!/^\d{6}$/.test(value)) return "Enter valid 6-digit pincode"
        return ""
      
      case "experience":
        if (value !== undefined && value < 0) return "Experience cannot be negative"
        return ""
      
      case "salaryExpectation":
        if (value !== undefined && value < 0) return "Salary cannot be negative"
        return ""
      
      default:
        return ""
    }
  }

  const handleBlur = (field: string) => {
    const value = formData[field as keyof typeof formData]
    const error = validateField(field, value)
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }))
    }
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
    if (!formData.permanentAddress || !formData.operatingAddress || !formData.city || !formData.state || !formData.pincode) {
      setError("Please fill in all required address fields")
      return false
    }
    
    const errors: Record<string, string> = {}
    
    const permanentAddressError = validateField("permanentAddress", formData.permanentAddress)
    if (permanentAddressError) errors.permanentAddress = permanentAddressError
    
    const operatingAddressError = validateField("operatingAddress", formData.operatingAddress)
    if (operatingAddressError) errors.operatingAddress = operatingAddressError
    
    const cityError = validateField("city", formData.city)
    if (cityError) errors.city = cityError
    
    const stateError = validateField("state", formData.state)
    if (stateError) errors.state = stateError
    
    const pincodeError = validateField("pincode", formData.pincode)
    if (pincodeError) errors.pincode = pincodeError
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError("Please fix the errors in the form")
      return false
    }
    
    return true
  }

  const handleNext = () => {
    setError("")
    
    // Step 1: Personal Info
    if (currentStep === 1) {
      const errors: Record<string, string> = {}
      
      const firstNameError = validateField("firstName", formData.firstName)
      if (firstNameError) errors.firstName = firstNameError
      
      const lastNameError = validateField("lastName", formData.lastName)
      if (lastNameError) errors.lastName = lastNameError
      
      const emailError = validateField("email", formData.email)
      if (emailError) errors.email = emailError
      
      const phoneError = validateField("phoneNumber", formData.phoneNumber)
      if (phoneError) errors.phoneNumber = phoneError
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setError("Please fix the errors in the form")
        return
      }
    }
    
    // Step 2: DL Document
    if (currentStep === 2) {
      const dlError = validateField("dlNumber", formData.dlNumber)
      if (dlError) {
        setFieldErrors({ dlNumber: dlError })
        setError(dlError)
        return
      }
      if (!files.dlImage) {
        setError("Please upload your DL image")
        return
      }
    }
    
    // Step 3: PAN Document
    if (currentStep === 3) {
      const panError = validateField("panNumber", formData.panNumber)
      if (panError) {
        setFieldErrors({ panNumber: panError })
        setError(panError)
        return
      }
    }
    
    // Step 4: Aadhar Document
    if (currentStep === 4) {
      const aadharError = validateField("aadharNumber", formData.aadharNumber)
      if (aadharError) {
        setFieldErrors({ aadharNumber: aadharError })
        setError(aadharError)
        return
      }
    }
    
    // Step 5: Address
    if (currentStep === 5 && !validateStep3()) return
    
    // Step 6: Experience & Salary (now mandatory)
    if (currentStep === 6) {
      const errors: Record<string, string> = {}
      
      if (formData.experience === undefined || formData.experience === null || (typeof formData.experience === 'string' && formData.experience === "")) {
        errors.experience = "Experience is required"
      } else {
        const expError = validateField("experience", formData.experience)
        if (expError) errors.experience = expError
      }
      
      if (formData.salaryExpectation === undefined || formData.salaryExpectation === null || (typeof formData.salaryExpectation === 'string' && formData.salaryExpectation === "")) {
        errors.salaryExpectation = "Salary expectation is required"
      } else {
        const salaryError = validateField("salaryExpectation", formData.salaryExpectation)
        if (salaryError) errors.salaryExpectation = salaryError
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setError("Please fill in all required fields")
        return
      }
    }
    
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
    
    // Validate Experience & Salary
    if (formData.experience === undefined || formData.experience === null || (typeof formData.experience === 'string' && formData.experience === "")) {
      setError("Experience is required")
      return
    }
    
    if (formData.salaryExpectation === undefined || formData.salaryExpectation === null || (typeof formData.salaryExpectation === 'string' && formData.salaryExpectation === "")) {
      setError("Salary expectation is required")
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
                {step < 6 && (
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
                        placeholder=""
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        onBlur={() => handleBlur("firstName")}
                        className={fieldErrors.firstName ? "border-red-500" : ""}
                      />
                      {fieldErrors.firstName && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Last Name *
                      </label>
                      <Input
                        required
                        placeholder=""
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        onBlur={() => handleBlur("lastName")}
                        className={fieldErrors.lastName ? "border-red-500" : ""}
                      />
                      {fieldErrors.lastName && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Email Address *
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder=""
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={fieldErrors.email ? "border-red-500" : ""}
                    />
                    {fieldErrors.email ? (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        You'll use this email to sign in later
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Phone Number *
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder=""
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      onBlur={() => handleBlur("phoneNumber")}
                      className={fieldErrors.phoneNumber ? "border-red-500" : ""}
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.phoneNumber}</p>
                    )}
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
                      placeholder=""
                      value={formData.dlNumber}
                      onChange={(e) => handleInputChange("dlNumber", e.target.value)}
                      onBlur={() => handleBlur("dlNumber")}
                      className={fieldErrors.dlNumber ? "border-red-500" : ""}
                    />
                    {fieldErrors.dlNumber ? (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.dlNumber}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Format: XX##YYYYYYYYYYY
                      </p>
                    )}
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
                      placeholder=""
                      value={formData.panNumber}
                      onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())}
                      onBlur={() => handleBlur("panNumber")}
                      className={fieldErrors.panNumber ? "border-red-500" : ""}
                    />
                    {fieldErrors.panNumber ? (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.panNumber}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Format: ABCDE1234F (5 letters + 4 digits + 1 letter)
                      </p>
                    )}
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
                      placeholder=""
                      value={formData.aadharNumber}
                      onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
                      onBlur={() => handleBlur("aadharNumber")}
                      className={fieldErrors.aadharNumber ? "border-red-500" : ""}
                    />
                    {fieldErrors.aadharNumber ? (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.aadharNumber}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        12 digits (can include spaces or dashes)
                      </p>
                    )}
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
                      placeholder=""
                      value={formData.permanentAddress}
                      onChange={(e) => handleInputChange("permanentAddress", e.target.value)}
                      onBlur={() => handleBlur("permanentAddress")}
                      className={fieldErrors.permanentAddress ? "border-red-500" : ""}
                    />
                    {fieldErrors.permanentAddress && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.permanentAddress}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Operating Address *
                    </label>
                    <Input
                      required
                      placeholder=""
                      value={formData.operatingAddress}
                      onChange={(e) => handleInputChange("operatingAddress", e.target.value)}
                      onBlur={() => handleBlur("operatingAddress")}
                      className={fieldErrors.operatingAddress ? "border-red-500" : ""}
                    />
                    {fieldErrors.operatingAddress && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.operatingAddress}</p>
                    )}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        City *
                      </label>
                      <Input
                        required
                        placeholder=""
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        onBlur={() => handleBlur("city")}
                        className={fieldErrors.city ? "border-red-500" : ""}
                      />
                      {fieldErrors.city && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        State *
                      </label>
                      <Input
                        required
                        placeholder=""
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        onBlur={() => handleBlur("state")}
                        className={fieldErrors.state ? "border-red-500" : ""}
                      />
                      {fieldErrors.state && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Pincode *
                      </label>
                      <Input
                        required
                        placeholder=""
                        value={formData.pincode}
                        onChange={(e) => handleInputChange("pincode", e.target.value)}
                        onBlur={() => handleBlur("pincode")}
                        className={fieldErrors.pincode ? "border-red-500" : ""}
                      />
                      {fieldErrors.pincode && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.pincode}</p>
                      )}
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
                    Enter your driving experience and salary expectations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Experience (years) *
                      </label>
                      <Input
                        required
                        type="number"
                        min="0"
                        placeholder=""
                        value={formData.experience || ""}
                        onChange={(e) => handleInputChange("experience", e.target.value ? parseInt(e.target.value) : "")}
                        onBlur={() => handleBlur("experience")}
                        className={fieldErrors.experience ? "border-red-500" : ""}
                      />
                      {fieldErrors.experience && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.experience}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Salary Expectation (₹/month) *
                      </label>
                      <Input
                        required
                        type="number"
                        min="0"
                        placeholder=""
                        value={formData.salaryExpectation || ""}
                        onChange={(e) => handleInputChange("salaryExpectation", e.target.value ? parseInt(e.target.value) : "")}
                        onBlur={() => handleBlur("salaryExpectation")}
                        className={fieldErrors.salaryExpectation ? "border-red-500" : ""}
                      />
                      {fieldErrors.salaryExpectation && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.salaryExpectation}</p>
                      )}
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
