# Drivers24 Frontend

Modern Next.js frontend for the Drivers24 platform - connecting users with verified professional drivers.

## Features

- 🔐 **Clerk Authentication** - Secure user authentication and management
- 👥 **Role-Based Access** - Three user roles: USER, DRIVER, and ADMIN
- 🎨 **Modern UI** - Beautiful, responsive design with TailwindCSS v4
- 🚗 **Driver Profiles** - Comprehensive driver profile management
- 🔍 **City-Based Search** - Find drivers in your city
- ✅ **Admin Verification** - Admin dashboard for verifying drivers
- 📱 **Fully Responsive** - Works seamlessly on all devices

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** Bun
- **Language:** TypeScript
- **Styling:** TailwindCSS v4
- **Authentication:** Clerk
- **State Management:** LocalStorage + React Hooks

## Getting Started

### Prerequisites

- Bun installed
- Clerk account with API keys
- Backend server running (see `driver-save-backend`)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## Project Structure

```
driver-save-frontend/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with Clerk provider
│   ├── select-role/                # Role selection page
│   ├── sign-in/                    # Clerk sign-in page
│   ├── sign-up/                    # Clerk sign-up page
│   └── dashboard/
│       ├── user/                   # User dashboard (search drivers)
│       ├── driver/                 # Driver dashboard (manage profile)
│       └── admin/                  # Admin dashboard (verify drivers)
├── components/
│   ├── navbar.tsx                  # Navigation bar
│   └── ui/                         # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/
│   ├── api.ts                      # API utility functions
│   └── store.ts                    # Simple state management
└── middleware.ts                   # Clerk middleware for auth

```

## User Flows

### For Users (Finding Drivers)
1. Sign up/Sign in with Clerk
2. Select "USER" role and enter city
3. Search for drivers in your city
4. View verified driver profiles
5. Contact drivers

### For Drivers (Creating Profile)
1. Sign up/Sign in with Clerk
2. Select "DRIVER" role and enter operating city
3. Create detailed driver profile with:
   - Personal information
   - RC and DL numbers
   - Vehicle details
   - Experience
4. Wait for admin verification
5. Toggle availability status

### For Admins (Managing Platform)
1. Sign up/Sign in with Clerk
2. Select "ADMIN" role
3. View all drivers
4. Filter by verification status
5. Verify driver profiles
6. Monitor platform statistics

## API Integration

The frontend communicates with the backend API for:

- **Role Selection:** `POST /api/auth/select-role`
- **Driver Operations:** CRUD operations on driver profiles
- **Search:** City-based driver search
- **Admin Actions:** Driver verification

All API calls use custom JWT tokens stored in localStorage after role selection.

## Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun lint` - Run ESLint

## Authentication Flow

1. User authenticates with Clerk (OAuth/Email)
2. After Clerk auth, user selects role (USER/DRIVER)
3. Backend generates custom JWT token with role
4. Frontend stores JWT in localStorage
5. All subsequent API calls use this JWT token
6. Role-based routing and UI rendering

## Styling

The application uses TailwindCSS v4 with a custom design system:

- **Colors:** Black/White with semantic variants
- **Typography:** Geist Sans and Geist Mono fonts
- **Components:** Custom-built UI components
- **Dark Mode:** Full dark mode support
- **Responsive:** Mobile-first approach

## Development Notes

- Uses Next.js App Router (not Pages Router)
- Client components for interactivity
- Server-side Clerk authentication
- Type-safe with TypeScript
- Modern React patterns (hooks, functional components)

## Deployment

The application can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any Node.js hosting**

Make sure to set environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC
