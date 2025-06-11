import { NextResponse } from "next/server"
import { getAllAccessRecords } from "@/lib/firestore"

/*
API 엔드포인트: GET /api/access-records
응답 형식:
{
  success: boolean,
  data: AccessRecord[],
  message?: string
}
*/

export async function GET() {
  try {
    const records = await getAllAccessRecords()

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error("출입 기록 API 오류:", error)

    return NextResponse.json(
      {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
