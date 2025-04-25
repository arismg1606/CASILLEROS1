// Firebase configuration and initialization
import { initializeApp } from "firebase/app"
import { getDatabase, ref, get, set, onValue } from "firebase/database"
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"

// Your Firebase configuration
// Using the provided Realtime Database URL
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForPublicRepo",
  authDomain: "numeros-casilleros.firebaseapp.com",
  databaseURL: "https://numeros-casilleros-default-rtdb.firebaseio.com/",
  projectId: "numeros-casilleros",
  storageBucket: "numeros-casilleros.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)

// Database reference paths
const LOCKER_REF_PATH = "lockers/current"

// Admin password - in a real app, this would be stored securely in the database
const ADMIN_PASSWORD = "CEFARB24"

// Function to verify admin password
export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

// Function to get the current locker number from Realtime Database
export async function getCurrentLockerNumber(): Promise<string> {
  try {
    const lockerRef = ref(database, LOCKER_REF_PATH)
    const snapshot = await get(lockerRef)

    if (snapshot.exists()) {
      return snapshot.val().number || "1234" // Default to '1234' if number field doesn't exist
    } else {
      // Node doesn't exist, create it with default value
      await set(lockerRef, { number: "1234" })
      return "1234"
    }
  } catch (error) {
    console.error("Error getting locker number:", error)
    return "1234" // Return default on error
  }
}

// Function to update the locker number in Realtime Database
export async function updateLockerNumber(number: string): Promise<boolean> {
  try {
    const lockerRef = ref(database, LOCKER_REF_PATH)
    await set(lockerRef, { number })
    return true
  } catch (error) {
    console.error("Error updating locker number:", error)
    return false
  }
}

// Function to listen for real-time updates to the locker number
export function subscribeToLockerUpdates(callback: (number: string) => void): () => void {
  const lockerRef = ref(database, LOCKER_REF_PATH)

  const unsubscribe = onValue(
    lockerRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val().number || "1234")
      } else {
        callback("1234")
      }
    },
    (error) => {
      console.error("Error listening for locker updates:", error)
    },
  )

  return unsubscribe
}

export async function loginAdmin(email: string, password: string): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return true
  } catch (error) {
    console.error("Error logging in admin:", error)
    return false
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Error logging out admin:", error)
    throw error
  }
}

export function getCurrentUser(): { email: string | null } | null {
  const user = auth.currentUser
  if (user) {
    return { email: user.email }
  } else {
    return null
  }
}
