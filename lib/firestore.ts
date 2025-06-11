import { collection, doc, getDocs, getDoc, query, orderBy, limit, where, type Timestamp } from "firebase/firestore"
import { db } from "./firebase"

/*
Firestore 데이터 구조:

Collection: 'access_records'
Document 구조:
{
  id: string,                    // 문서 ID (자동 생성)
  time: Timestamp,               // Firebase Timestamp 객체
  status: 'entry' | 'exit',      // 출입 상태
  photo: string,                 // 사진 URL (선택사항)
  videoUrl: string,              // 비디오 URL (선택사항)
  createdAt: Timestamp,          // 생성 시간
  updatedAt: Timestamp           // 수정 시간
}

인덱스 설정 권장:
- time (내림차순)
- status + time (복합 인덱스)
- createdAt (내림차순)
*/

export interface AccessRecord {
  id: string
  time: string // ISO 8601 형식으로 변환된 시간
  status: "entry" | "exit" | "unknown"
  photo?: string
  videoUrl?: string
}

export interface AccessRecordDetail extends AccessRecord {
  photo: string
  videoUrl: string
}

// Timestamp를 ISO 문자열로 변환하는 헬퍼 함수
const timestampToISOString = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString()
}

// 모든 출입 기록 조회
export async function getAllAccessRecords(): Promise<AccessRecord[]> {
  try {
    const accessRecordsRef = collection(db, "access_records")
    const q = query(accessRecordsRef, orderBy("time", "desc"))
    const querySnapshot = await getDocs(q)

    const records: AccessRecord[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      records.push({
        id: doc.id,
        time: timestampToISOString(data.time),
        status: data.status,
        photo: data.photo || "",
        videoUrl: data.videoUrl || "",
      })
    })

    return records
  } catch (error) {
    console.error("Firestore에서 출입 기록 조회 실패:", error)
    throw new Error("출입 기록을 불러오는데 실패했습니다.")
  }
}

// 최근 출입 기록 조회 (제한된 개수)
export async function getRecentAccessRecords(limitCount = 5): Promise<AccessRecord[]> {
  try {
    const accessRecordsRef = collection(db, "access_records")
    const q = query(accessRecordsRef, orderBy("time", "desc"), limit(limitCount))
    const querySnapshot = await getDocs(q)

    const records: AccessRecord[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      records.push({
        id: doc.id,
        time: timestampToISOString(data.time),
        status: data.status,
        photo: data.photo || "",
        videoUrl: data.videoUrl || "",
      })
    })

    return records
  } catch (error) {
    console.error("Firestore에서 최근 출입 기록 조회 실패:", error)
    throw new Error("최근 출입 기록을 불러오는데 실패했습니다.")
  }
}

// 특정 출입 기록 상세 조회
export async function getAccessRecordById(id: string): Promise<AccessRecordDetail | null> {
  try {
    const docRef = doc(db, "access_records", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      time: timestampToISOString(data.time),
      status: data.status,
      photo: data.photo || "/placeholder.svg?height=200&width=200",
      videoUrl: data.videoUrl || "/placeholder-video.mp4",
    }
  } catch (error) {
    console.error("Firestore에서 출입 기록 상세 조회 실패:", error)
    throw new Error("출입 기록 상세 정보를 불러오는데 실패했습니다.")
  }
}

// 상태별 출입 기록 조회 (선택사항)
export async function getAccessRecordsByStatus(status: "entry" | "exit" | "unknown"): Promise<AccessRecord[]> {
  try {
    const accessRecordsRef = collection(db, "access_records")
    const q = query(accessRecordsRef, where("status", "==", status), orderBy("time", "desc"))
    const querySnapshot = await getDocs(q)

    const records: AccessRecord[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      records.push({
        id: doc.id,
        time: timestampToISOString(data.time),
        status: data.status,
        photo: data.photo || "",
        videoUrl: data.videoUrl || "",
      })
    })

    return records
  } catch (error) {
    console.error("Firestore에서 상태별 출입 기록 조회 실패:", error)
    throw new Error("상태별 출입 기록을 불러오는데 실패했습니다.")
  }
}
