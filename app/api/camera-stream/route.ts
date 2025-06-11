import { type NextRequest, NextResponse } from "next/server"

/*
API 엔드포인트: GET /api/camera-stream
MJPEG 스트림을 프록시하여 클라이언트에 제공

보안상 MJPEG_STREAM_URL을 직접 클라이언트에 노출하지 않고
서버에서 프록시하여 제공합니다.
*/

export async function GET(request: NextRequest) {
  try {
    const streamUrl = process.env.MJPEG_STREAM_URL

    if (!streamUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "MJPEG_STREAM_URL 환경 변수가 설정되지 않았습니다.",
        },
        { status: 500 },
      )
    }

    // MJPEG 스트림에 요청
    const response = await fetch(streamUrl, {
      method: "GET",
      headers: {
        "User-Agent": "DoorCam/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`스트림 서버 응답 오류: ${response.status}`)
    }

    // 스트림 데이터를 그대로 전달
    const headers = new Headers()
    headers.set("Content-Type", response.headers.get("Content-Type") || "multipart/x-mixed-replace")
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    return new NextResponse(response.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("카메라 스트림 프록시 오류:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "스트림 연결 실패",
      },
      { status: 500 },
    )
  }
}
