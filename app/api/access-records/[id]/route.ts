import { NextResponse } from "next/server"
import { getAccessRecordById } from "@/lib/firestore"

/*
API 엔드포인트: GET /api/access-records/{id}
경로 파라미터:
- id: 출입 기록 ID (Firestore 문서 ID)

응답 형식:
{
  success: boolean,
  data: AccessRecordDetail | null,
  message?: string
}
*/

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // ID 검증
    if (!id || typeof id !== "string" || id.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "유효하지 않은 ID입니다.",
        },
        { status: 400 },
      )
    }

    const record = await getAccessRecordById(id)

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "출입 기록을 찾을 수 없습니다.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: record,
    })
  } catch (error) {
    console.error("출입 기록 상세 API 오류:", error)

    return NextResponse.json(
      {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
