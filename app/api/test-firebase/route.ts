import { NextResponse } from "next/server"
import { testFirebaseStorageConnection } from "@/lib/video-capture"

/*
API 엔드포인트: GET /api/test-firebase
Firebase Storage 연결 테스트

응답 형식:
{
  success: boolean,
  message: string,
  config: {
    projectId: string,
    storageBucket: string,
    authDomain: string,
    configured: boolean
  },
  error?: string
}
*/

export async function GET() {
  try {
    console.log("Firebase Storage 연결 테스트 시작")

    const result = await testFirebaseStorageConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Firebase Storage 연결 성공",
        config: result.config,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Firebase Storage 연결 실패",
          config: result.config,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Firebase 테스트 API 오류:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Firebase 테스트 실패",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    )
  }
}
