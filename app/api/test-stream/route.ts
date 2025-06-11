import { NextResponse } from "next/server"
import { testMjpegStream, checkFFmpegInstallation } from "@/lib/video-capture"

/*
API 엔드포인트: GET /api/test-stream
MJPEG 스트림 연결 테스트

응답 형식:
{
  success: boolean,
  message: string,
  streamUrl?: string,
  ffmpegStatus?: {
    available: boolean,
    path?: string,
    method?: string,
    error?: string
  }
}
*/

export async function GET() {
  try {
    const streamUrl = process.env.MJPEG_STREAM_URL

    if (!streamUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "MJPEG_STREAM_URL 환경 변수가 설정되지 않았습니다.",
        },
        { status: 400 },
      )
    }

    // ffmpeg 설치 상태 확인
    const ffmpegStatus = checkFFmpegInstallation()
    console.log("ffmpeg 상태:", ffmpegStatus)

    console.log("스트림 연결 테스트 시작")
    const isConnected = await testMjpegStream()

    return NextResponse.json({
      success: true,
      message: "스트림 연결 성공",
      streamUrl,
      ffmpegStatus,
    })
  } catch (error) {
    console.error("스트림 테스트 API 오류:", error)

    // ffmpeg 상태도 함께 반환
    const ffmpegStatus = checkFFmpegInstallation()

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "스트림 연결 테스트 실패",
        ffmpegStatus,
      },
      { status: 500 },
    )
  }
}
