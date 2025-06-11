import { NextResponse } from "next/server"
import { getRecentAccessRecords } from "@/lib/firestore"

/*
API 엔드포인트: GET /api/access-records/recent?limit=5
쿼리 파라미터:
- limit: 가져올 기록 수 (기본값: 5)

응답 형식:
{
  success: boolean,
  data: AccessRecord[],
  message?: string
}
*/

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 5

    // limit 값 검증
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message: "limit 값은 1-100 사이의 숫자여야 합니다.",
        },
        { status: 400 },
      )
    }

    const records = await getRecentAccessRecords(limit)

    return NextResponse.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error("최근 출입 기록 API 오류:", error)

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
