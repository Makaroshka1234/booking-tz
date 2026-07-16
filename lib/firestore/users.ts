import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  type Query,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { mapUserDoc } from "@/lib/firestore/subscriptions"
import type { User } from "@/types"

const usersCollection = collection(db, "users")
const USERS_PAGE_SIZE = 20

export async function fetchUsersPage(cursor?: QueryDocumentSnapshot): Promise<{
  users: (User & { uid: string })[]
  nextCursor: QueryDocumentSnapshot | null
}> {
  const constraints: any[] = [orderBy("name"), limit(USERS_PAGE_SIZE + 1)]

  if (cursor) {
    constraints.push(startAfter(cursor))
  }

  const q = query(usersCollection, ...constraints)
  const snapshot = await getDocs(q)

  const docs = snapshot.docs
  const hasMore = docs.length > USERS_PAGE_SIZE
  const pageDocs = hasMore ? docs.slice(0, USERS_PAGE_SIZE) : docs

  const users = pageDocs.map(mapUserDoc)
  const nextCursor = hasMore ? docs[USERS_PAGE_SIZE] : null

  return { users, nextCursor }
}
