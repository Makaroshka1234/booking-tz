import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential,
} from "firebase/auth"
import { doc, setDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "./firebase"
import type { User } from "@/types"

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  try {
    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    const firebaseUser = userCredential.user

    // Update profile with display name
    await updateProfile(firebaseUser, { displayName: name })

    // Create user document in Firestore
    const userDoc: User = {
      uid: firebaseUser.uid,
      name,
      email,
      createdAt: Timestamp.now(),
    }

    await setDoc(doc(db, "users", firebaseUser.uid), userDoc)

    return userDoc
  } catch (error) {
    throw new Error(
      `Registration failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    const firebaseUser = userCredential.user

    return {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || "",
      email: firebaseUser.email || "",
      createdAt: Timestamp.now(),
    }
  } catch (error) {
    throw new Error(
      `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    throw new Error(
      `Logout failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}
