"use client"

import { useEffect, ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useAuthStore } from "@/store/useAuthStore"
import type { User } from "@/types"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user document from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User
            setUser(userData)
          } else {
            // Fallback to Firebase Auth user data if Firestore doc doesn't exist
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              createdAt: Timestamp.now(),
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setLoading])

  return <>{children}</>
}
