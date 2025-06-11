import { NextResponse } from "next/server"
import { captureMjpegStream, saveAccessRecord } from "@/lib/video-capture"

/*
API 엔드포인트: GET /api/record?status=entry
쿼리 파라미터:
- status: 'entry' | 'exit' (기본값: 'entry')
- duration: 캡처 시간(초) (기본값: 15)

응답 형식:
{
  success: boolean,
  data: {
    id: string,        // Firestore 문서 ID
    videoUrl: string,  // 비디오 URL
    thumbnailUrl: string, // 썸네일 URL
    timestamp: string, // 타임스탬프 (ISO 형식)
    status: string     // 출입 상태
  },
  message?: string
}
*/

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = (searchParams.get("status") || "unknown") as "entry" | "exit" | "unknown"
    const durationParam = searchParams.get("duration")
    const duration = durationParam ? Number.parseInt(durationParam, 10) : 15

    // 상태 검증
    if (status !== "entry" && status !== "exit" && status !== "unknown") {
      return NextResponse.json(
        {
          success: false,
          message: "status는 'entry', 'exit' 또는 'unknown'이어야 합니다.",
        },
        { status: 400 },
      )
    }

    // 지속 시간 검증
    if (isNaN(duration) || duration < 1 || duration > 60) {
      return NextResponse.json(
        {
          success: false,
          message: "duration은 1-60 사이의 숫자여야 합니다.",
        },
        { status: 400 },
      )
    }

    // MJPEG 스트림 캡처 및 업로드
    const captureResult = await captureMjpegStream(duration)

    // Firestore에 기록 저장
    const recordId = await saveAccessRecord(status, captureResult.videoUrl, captureResult.thumbnailUrl)

    return NextResponse.json({
      success: true,
      data: {
        id: recordId,
        videoUrl: captureResult.videoUrl,
        thumbnailUrl: captureResult.thumbnailUrl,
        timestamp: captureResult.timestamp.toISOString(),
        status,
      },
    })
  } catch (error) {
    console.error("출입 기록 생성 API 오류:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
