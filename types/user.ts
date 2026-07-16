import { Timestamp } from "firebase/firestore"

export interface User {
  uid: string
  name: string
  email: string
  createdAt: Timestamp
}
