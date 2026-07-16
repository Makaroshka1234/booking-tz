# Booking App - Setup Guide

## Project Structure

```
booking-tz/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── rooms/
│   │   │   └── page.tsx
│   │   ├── bookings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── globals.css
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # shadcn/ui components
│   │   └── index.ts
│   └── forms/               # Form components
│       ├── login-form.tsx
│       ├── register-form.tsx
│       └── booking-form.tsx
├── lib/
│   ├── firebase.ts          # Firebase initialization
│   └── utils.ts             # Utility functions
├── store/                   # Zustand stores
│   ├── auth.ts
│   ├── bookings.ts
│   └── rooms.ts
├── types/
│   └── index.ts             # TypeScript types
├── hooks/
│   └── index.ts             # Custom React hooks
├── public/                  # Static assets
├── components.json          # shadcn/ui config
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
├── next.config.ts           # Next.js config
└── postcss.config.mjs       # PostCSS config
```

## Installed Dependencies

### Core
- **Next.js** 16.2.10
- **React** 19.2.4
- **React DOM** 19.2.4
- **TypeScript** 5

### State Management & Forms
- **Zustand** 5.0.14 - Lightweight state management
- **react-hook-form** 7.81.0 - Form state & validation
- **zod** 4.4.3 - Schema validation
- **@hookform/resolvers** 5.4.0 - Zod integration with RHF

### UI & Styling
- **shadcn/ui** - Component library (via npx shadcn@latest init)
- **Tailwind CSS** 4 with @tailwindcss/postcss
- **tailwindcss-animate** - Animation utilities

### Backend/Services
- **Firebase** 12.16.0 - Auth, Firestore, Storage

### Date/Time
- **date-fns** 4.4.0 - Date utilities

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Required
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxxx:web:xxxxx

# Optional (only needed if using Storage or Cloud Messaging)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
```

Get these values from your Firebase Console → Project Settings.

## Getting Started

```bash
# Install dependencies
npm install

# Add shadcn/ui components as needed
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
# etc.

# Run dev server
npm run dev

# Build for production
npm run build
npm start
```

## Firestore Data Model

### Collections & Documents

#### `users/{uid}`
User profile information

```typescript
{
  uid: string              // Document ID = Firebase UID
  name: string
  email: string
  createdAt: Timestamp
}
```

#### `rooms/{roomId}`
Room/space information

```typescript
{
  id: string               // Document ID = Room ID
  name: string             // e.g., "Meeting Room A"
  description: string      // e.g., "Seats 10 people"
  createdBy: string        // uid of the creator
  createdAt: Timestamp
}
```

#### `roomMembers/{roomId}_{uid}`
Room membership & roles (separate collection to track roles independently)

```typescript
{
  id: string               // Document ID = "{roomId}_{uid}"
  roomId: string
  uid: string
  email: string            // Cached for quick access
  role: "admin" | "user"   // admin = can edit/delete room & bookings
  addedAt: Timestamp
}
```

#### `bookings/{bookingId}`
Room bookings/reservations

```typescript
{
  id: string               // Document ID = Booking ID
  roomId: string           // Reference to room
  title: string            // e.g., "Team Standup"
  description: string      // Optional details
  startTime: Timestamp
  endTime: Timestamp
  createdBy: string        // uid of the person who booked
  participants: string[]   // Array of uids attending
  createdAt: Timestamp
}
```

## Authentication System

### Setup
- **store/useAuthStore.ts** — Zustand store managing `{ user, loading }`
- **lib/auth.ts** — Auth functions: `registerUser()`, `loginUser()`, `logoutUser()`
- **components/AuthProvider.tsx** — Subscribes to Firebase auth state changes
- **app/layout.tsx** — Wrapped with AuthProvider
- **hooks/useAuth.ts** — Custom hook for accessing auth state

### Usage in Components

```typescript
"use client"

import { useAuth } from "@/hooks"
import { registerUser, logoutUser } from "@/lib/auth"

export function LoginPage() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {user ? (
        <>
          <h1>Welcome, {user.name}</h1>
          <button onClick={logoutUser}>Logout</button>
        </>
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault()
          const name = "John Doe"
          const email = "john@example.com"
          const password = "password123"
          await registerUser(name, email, password)
        }}>
          {/* form fields */}
        </form>
      )}
    </div>
  )
}
```

### Auth Flow

1. **Registration**: `registerUser(name, email, password)`
   - Creates Firebase Auth user via `createUserWithEmailAndPassword`
   - Updates Firebase user profile with `displayName`
   - Creates Firestore document in `users/{uid}` collection

2. **Login**: `loginUser(email, password)`
   - Signs in with Firebase Auth
   - Returns user data object

3. **Logout**: `logoutUser()`
   - Signs out from Firebase Auth

4. **Session Persistence**:
   - `AuthProvider` component mounts on app startup
   - Listens to `onAuthStateChanged` for auth state changes
   - Fetches user data from Firestore `users/{uid}`
   - Stores in Zustand `useAuthStore`
   - Components can access via `useAuth()` hook

## TODO - Implementation Order

1. **Firebase Setup** ✅
   - [x] Configure Firebase in `lib/firebase.ts`
   - [x] Create env variables

2. **Types** ✅
   - [x] Define User, Room, Booking, Auth types

3. **Authentication** ✅
   - [x] Implement auth store (Zustand)
   - [x] Implement auth functions (register, login, logout)
   - [x] Create AuthProvider
   - [x] Create useAuth hook

4. **Stores**
   - [ ] Implement bookings store
   - [ ] Implement rooms store

4. **Components**
   - [ ] Add shadcn/ui components with `npx shadcn@latest add`
   - [ ] Create LoginForm component
   - [ ] Create RegisterForm component
   - [ ] Create BookingForm component

5. **Pages**
   - [ ] Implement login/register pages with auth logic
   - [ ] Implement rooms listing page
   - [ ] Implement bookings page
   - [ ] Implement layouts with navigation

6. **Features**
   - [ ] User authentication (Firebase)
   - [ ] Room listing & filtering
   - [ ] Booking creation/management
   - [ ] Date handling with date-fns
