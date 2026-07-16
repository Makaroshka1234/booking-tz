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

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as any)?.code
  const message = (error as any)?.message || ""

  switch (code) {
    case "auth/email-already-in-use":
      return "Користувач з таким email вже існує"
    case "auth/invalid-email":
      return "Невірний формат email"
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/user-not-found":
      return "Невірний email або пароль"
    case "auth/weak-password":
      return "Пароль занадто слабкий"
    default:
      return "Сталася помилка. Спробуйте ще раз"
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const userCredential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
  const firebaseUser = userCredential.user

  await updateProfile(firebaseUser, { displayName: name })

  const userDoc: User = {
    uid: firebaseUser.uid,
    name,
    email,
    createdAt: Timestamp.now(),
  }

  await setDoc(doc(db, "users", firebaseUser.uid), userDoc)

  return userDoc
}

export async function loginUser(email: string, password: string): Promise<User> {
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
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}
