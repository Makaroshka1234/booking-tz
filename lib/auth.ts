import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential,
} from "firebase/auth"
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore"
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

function buildUserRecord(uid: string, name: string, email: string, createdAt: Timestamp): User {
  return { uid, name, email, createdAt }
}

async function getUserDoc(uid: string): Promise<User | null> {
  const userDocRef = doc(db, "users", uid)
  const userDocSnap = await getDoc(userDocRef)
  return userDocSnap.exists() ? (userDocSnap.data() as User) : null
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

  const userDoc = buildUserRecord(firebaseUser.uid, name, email, Timestamp.now())

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

  const userDoc = await getUserDoc(firebaseUser.uid)
  if (userDoc) {
    return userDoc
  }

  return buildUserRecord(firebaseUser.uid, firebaseUser.displayName || "", firebaseUser.email || "", Timestamp.now())
}

export async function logoutUser(): Promise<void> {
  await signOut(auth)
}
