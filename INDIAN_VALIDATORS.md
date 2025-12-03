# Indian Field Validators - Guest Driver Registration

## ✅ Complete Validation Rules

All validators added to `/app/guest-driver/page.tsx` for Indian document formats.

---

## 📋 Step 1: Personal Information

### 1. **Name Validation**
```typescript
// Rules:
- Minimum 2 characters
- Only letters and spaces allowed
- No numbers or special characters

// Regex: /^[a-zA-Z\s]+$/
// Examples:
✅ "Aryan Jag Agarwal"
✅ "Rajesh Kumar"
❌ "John123"
❌ "A"
```

### 2. **Email Validation**
```typescript
// Rules:
- Standard email format
- Must have @ and domain

// Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Examples:
✅ "aryan@gmail.com"
✅ "user.name@company.co.in"
❌ "invalid@"
❌ "notanemail"
```

### 3. **Phone Number Validation** ⭐ Indian Format
```typescript
// Rules:
- Exactly 10 digits
- Must start with 6, 7, 8, or 9
- Spaces, dashes, and brackets are removed before validation

// Regex: /^[6-9]\d{9}$/
// Examples:
✅ "9876543210"
✅ "8765432109"
✅ "98765-43210" (cleaned to 9876543210)
✅ "(987) 654-3210" (cleaned to 9876543210)
❌ "1234567890" (doesn't start with 6-9)
❌ "987654321" (only 9 digits)
❌ "98765432101" (11 digits)
```

---

## 📄 Step 2: Document Details

### 1. **Driving License (DL) Number** ⭐ Indian Format
```typescript
// Rules:
- State Code: 2 uppercase letters (e.g., MH, DL, KA)
- RTO Code: 2 digits (e.g., 01, 14)
- Year: 4 digits (e.g., 2023)
- Serial Number: 7 digits
- Separators (-, space) are optional

// Regex: /^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$/
// Format: XX##YYYYYYYYYYY or XX-##-YYYY-YYYYYYY

// Examples:
✅ "MH0120230001234" (Maharashtra, RTO 01, 2023, serial 0001234)
✅ "MH01-2023-0001234"
✅ "MH-01-2023-0001234"
✅ "DL1420240005678" (Delhi, RTO 14, 2024)
✅ "KA0320220009876" (Karnataka, RTO 03, 2022)
❌ "MH012023001234" (only 6 serial digits)
❌ "123420230001234" (state code not letters)
❌ "MH1234567890" (wrong format)
```

### 2. **PAN Number** ⭐ Indian Format
```typescript
// Rules:
- 5 uppercase letters
- 4 digits
- 1 uppercase letter
- Total: 10 characters
- Auto-converted to uppercase

// Regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
// Format: ABCDE1234F

// Examples:
✅ "ABCDE1234F"
✅ "BNZPM2501R"
✅ "AABCP1234C"
✅ "abcde1234f" (auto-converted to ABCDE1234F)
❌ "ABCD1234F" (only 4 letters at start)
❌ "ABCDE12345" (5 digits instead of 4)
❌ "ABCDE1234" (missing last letter)
```

### 3. **Aadhar Number** ⭐ Indian Format
```typescript
// Rules:
- Exactly 12 digits
- Spaces and dashes are removed before validation
- Can be entered with or without formatting

// Regex: /^\d{12}$/
// Format: XXXXXXXXXXXX or XXXX-XXXX-XXXX or XXXX XXXX XXXX

// Examples:
✅ "123456789012"
✅ "1234-5678-9012" (cleaned to 123456789012)
✅ "1234 5678 9012" (cleaned to 123456789012)
❌ "12345678901" (only 11 digits)
❌ "1234567890123" (13 digits)
❌ "ABCD56789012" (contains letters)
```

---

## 🏠 Step 3: Address Details

### 1. **Permanent Address Validation**
```typescript
// Rules:
- Minimum 10 characters
- Must be a meaningful address

// Examples:
✅ "123 Main Street, Andheri West"
✅ "Flat 4B, Building 7, Sector 15"
❌ "Mumbai" (too short)
❌ "123" (too short)
```

### 2. **Operating Address Validation**
```typescript
// Rules:
- Minimum 10 characters
- Must be a meaningful address

// Examples:
✅ "456 Park Road, Bandra East"
✅ "Shop 12, Market Complex, Dadar"
❌ "Delhi" (too short)
```

### 3. **City Validation**
```typescript
// Rules:
- Minimum 2 characters
- Only letters and spaces
- No numbers or special characters

// Regex: /^[a-zA-Z\s]+$/
// Examples:
✅ "Mumbai"
✅ "New Delhi"
✅ "Bangalore"
❌ "Mumbai123"
❌ "M"
```

### 4. **Pincode Validation** ⭐ Indian Format (Optional)
```typescript
// Rules:
- Exactly 6 digits
- Optional field

// Regex: /^\d{6}$/
// Examples:
✅ "400001" (Mumbai)
✅ "110001" (Delhi)
✅ "560001" (Bangalore)
✅ "" (empty - optional)
❌ "40000" (only 5 digits)
❌ "4000012" (7 digits)
❌ "ABC123" (contains letters)
```

### 5. **State Validation** (Optional)
```typescript
// Rules:
- Minimum 2 characters if provided
- Optional field

// Examples:
✅ "Maharashtra"
✅ "Delhi"
✅ "Karnataka"
✅ "" (empty - optional)
❌ "M" (too short)
```

---

## 🎯 Validation Summary

### Step 1: Personal Info
| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Name | ✅ Yes | Letters & spaces, min 2 chars | "Aryan Jag Agarwal" |
| Email | ✅ Yes | Standard email | "aryan@gmail.com" |
| Phone | ✅ Yes | 10 digits, starts with 6-9 | "9876543210" |

### Step 2: Documents
| Field | Required | Format | Example |
|-------|----------|--------|---------|
| DL Number | ✅ Yes | XX##YYYYYYYYYYY | "MH0120230001234" |
| PAN Number | ✅ Yes | ABCDE1234F | "BNZPM2501R" |
| Aadhar Number | ✅ Yes | 12 digits | "1234-5678-9012" |
| DL Image | ✅ Yes | File upload | image.jpg |
| PAN Image | ❌ No | File upload | image.jpg |
| Aadhar Image | ❌ No | File upload | image.jpg |

### Step 3: Address
| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Permanent Address | ✅ Yes | Min 10 chars | "123 Main St, Andheri" |
| Operating Address | ✅ Yes | Min 10 chars | "456 Park Rd, Bandra" |
| City | ✅ Yes | Letters & spaces, min 2 | "Mumbai" |
| State | ❌ No | Min 2 chars | "Maharashtra" |
| Pincode | ❌ No | 6 digits | "400001" |

### Step 4: Experience (Optional)
| Field | Required | Format | Example |
|-------|----------|--------|---------|
| Experience | ❌ No | Number (years) | 5 |
| Salary Expectation | ❌ No | Number (₹) | 30000 |

---

## 🔍 Validation Error Messages

### Clear and Helpful Messages

```typescript
// Step 1 Errors
"Please fill in all required fields"
"Please enter a valid email address"
"Please enter a valid 10-digit Indian mobile number (starting with 6-9)"
"Name must be at least 2 characters long"
"Name should only contain letters and spaces"

// Step 2 Errors
"Please fill in all required document details"
"Please enter a valid DL number (e.g., MH01-20230001234 or MH0120230001234)"
"Please enter a valid PAN number (e.g., ABCDE1234F)"
"Please enter a valid 12-digit Aadhar number"
"DL image is required"

// Step 3 Errors
"Please fill in all required address fields"
"Permanent address must be at least 10 characters long"
"Operating address must be at least 10 characters long"
"City name must be at least 2 characters long"
"City name should only contain letters and spaces"
"Please enter a valid 6-digit pincode"
"State name must be at least 2 characters long"
```

---

## 📝 Input Formatting

### Auto-Formatting Features

1. **Phone Number:** Removes spaces, dashes, and brackets before validation
   - Input: `(987) 654-3210` → Validated as: `9876543210`

2. **PAN Number:** Auto-converted to uppercase
   - Input: `abcde1234f` → Stored as: `ABCDE1234F`

3. **DL Number:** Accepts with or without separators
   - Input: `MH-01-2023-0001234` → Valid
   - Input: `MH0120230001234` → Valid

4. **Aadhar Number:** Removes spaces and dashes
   - Input: `1234-5678-9012` → Validated as: `123456789012`
   - Input: `1234 5678 9012` → Validated as: `123456789012`

---

## 🎨 User Experience

### Progressive Validation
- Validation runs when clicking "Next" button
- Validation runs before final submit
- Clear error messages displayed at top of form
- Errors prevent progression to next step

### Helpful Placeholders
```typescript
// Recommended placeholders in input fields:
Phone: "9876543210"
DL: "MH01-2023-0001234"
PAN: "ABCDE1234F"
Aadhar: "1234-5678-9012"
Pincode: "400001"
```

---

## ✅ Testing Checklist

### Valid Test Data
```javascript
{
  name: "Aryan Jag Agarwal",
  email: "aryan@gmail.com",
  phoneNumber: "9876543210",
  dlNumber: "MH0120230001234",
  panNumber: "BNZPM2501R",
  aadharNumber: "123456789012",
  permanentAddress: "123 Main Street, Andheri West, Mumbai",
  operatingAddress: "456 Park Road, Bandra East, Mumbai",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  experience: 5,
  salaryExpectation: 30000
}
```

### Invalid Test Cases
```javascript
// Should fail validation:
phoneNumber: "1234567890" // Doesn't start with 6-9
dlNumber: "123420230001234" // State code not letters
panNumber: "ABCD1234F" // Only 4 letters at start
aadharNumber: "12345678901" // Only 11 digits
pincode: "40000" // Only 5 digits
city: "Mumbai123" // Contains numbers
```

---

## 🚀 Production Ready

All validators are:
- ✅ Compliant with Indian document formats
- ✅ User-friendly with clear error messages
- ✅ Flexible (accepts common formatting variations)
- ✅ Secure (prevents invalid data submission)
- ✅ Well-documented

**Your guest driver registration form is now production-ready with comprehensive Indian validators!**
