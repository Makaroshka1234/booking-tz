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
  const { setData, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User
            setData(userData)
          } else {
            setData({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              createdAt: Timestamp.now(),
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setData(null)
        }
      } else {
        setData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setData, setLoading])

  return <>{children}</>
}
