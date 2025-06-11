import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

/*
Firebase 설정
환경 변수에서 다음 값들을 설정해야 합니다:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- MJPEG_STREAM_URL (MJPEG 스트림 URL)
*/

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase 설정 검증
function validateFirebaseConfig() {
  const requiredFields = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]

  const missingFields = requiredFields.filter((field) => !firebaseConfig[field as keyof typeof firebaseConfig])

  if (missingFields.length > 0) {
    throw new Error(`Firebase 설정이 누락되었습니다: ${missingFields.join(", ")}`)
  }

  console.log("Firebase 설정 검증 완료:", {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    authDomain: firebaseConfig.authDomain,
  })
}

// Firebase 앱 초기화 (중복 초기화 방지)
let app
try {
  validateFirebaseConfig()
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  console.log("Firebase 앱 초기화 성공")
} catch (error) {
  console.error("Firebase 초기화 실패:", error)
  throw error
}

// Firestore 인스턴스
export const db = getFirestore(app)

// Storage 인스턴스
export const storage = getStorage(app)

// Firebase 설정 정보 내보내기 (디버깅용)
export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  authDomain: firebaseConfig.authDomain,
  configured: !!firebaseConfig.apiKey,
})

export default app
