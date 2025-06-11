// API 응답 데이터 타입 정의
/*
AccessRecord 타입:
{
  id: string;               // Firestore 문서 ID
  time: string;             // 출입 시간 (ISO 8601 형식: "2024-01-15T09:15:23.000Z")
  status: "entry" | "exit" | "unknown"; // 출입 상태
  photo?: string;           // 사진 URL (선택사항)
  videoUrl?: string;        // 녹화 영상 URL (선택사항)
}

AccessRecordDetail 타입:
{
  id: string;               // Firestore 문서 ID
  time: string;             // 출입 시간 (ISO 8601 형식)
  status: "entry" | "exit" | "unknown"; // 출입 상태
  photo: string;            // 사진 URL (필수)
  videoUrl: string;         // 녹화 영상 URL (필수)
}

API 응답 형식:
{
  success: boolean;         // 성공 여부
  data: AccessRecord[] | AccessRecordDetail | null; // 실제 데이터
  message?: string;         // 에러 메시지 (실패 시)
}
*/

export interface AccessRecord {
  id: string
  time: string
  status: "entry" | "exit" | "unknown"
  photo?: string
  videoUrl?: string
}

export interface AccessRecordDetail {
  id: string
  time: string
  status: "entry" | "exit" | "unknown"
  photo: string
  videoUrl: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// 출입 기록 목록 조회
export async function fetchAccessRecords(): Promise<AccessRecord[]> {
  try {
    const response = await fetch("/api/access-records", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<AccessRecord[]> = await response.json()

    if (!result.success) {
      throw new Error(result.message || "API 요청 실패")
    }

    return result.data
  } catch (error) {
    console.error("출입 기록 조회 실패:", error)
    throw error
  }
}

// 특정 출입 기록 상세 조회
export async function fetchAccessRecordDetail(id: string): Promise<AccessRecordDetail> {
  try {
    const response = await fetch(`/api/access-records/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<AccessRecordDetail> = await response.json()

    if (!result.success) {
      throw new Error(result.message || "API 요청 실패")
    }

    if (!result.data) {
      throw new Error("출입 기록을 찾을 수 없습니다.")
    }

    return result.data
  } catch (error) {
    console.error("출입 기록 상세 조회 실패:", error)
    throw error
  }
}

// 최근 출입 기록 조회 (대시보드용)
export async function fetchRecentAccessRecords(limit = 5): Promise<AccessRecord[]> {
  try {
    const response = await fetch(`/api/access-records/recent?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<AccessRecord[]> = await response.json()

    if (!result.success) {
      throw new Error(result.message || "API 요청 실패")
    }

    return result.data
  } catch (error) {
    console.error("최근 출입 기록 조회 실패:", error)
    throw error
  }
}
