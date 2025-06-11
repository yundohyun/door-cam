import { NextResponse } from "next/server"
import { checkFFmpegInstallation, testFirebaseStorageConnection } from "@/lib/video-capture"
import { execSync } from "child_process"

/*
API 엔드포인트: GET /api/system-status
시스템 상태 및 ffmpeg 설치 상태 확인

응답 형식:
{
  success: boolean,
  data: {
    ffmpeg: {
      available: boolean,
      path?: string,
      method?: string,
      version?: string,
      error?: string
    },
    firebase: {
      success: boolean,
      config: any,
      error?: string
    },
    environment: {
      nodeVersion: string,
      platform: string,
      arch: string
    },
    streamUrl: {
      configured: boolean,
      url?: string
    }
  }
}
*/

export async function GET() {
  try {
    // ffmpeg 상태 확인
    const ffmpegStatus = checkFFmpegInstallation()

    // ffmpeg 버전 확인 (가능한 경우)
    let ffmpegVersion = undefined
    if (ffmpegStatus.available && ffmpegStatus.path) {
      try {
        const versionOutput = execSync(`"${ffmpegStatus.path}" -version`, { encoding: "utf8" })
        const versionMatch = versionOutput.match(/ffmpeg version ([^\s]+)/)
        if (versionMatch) {
          ffmpegVersion = versionMatch[1]
        }
      } catch (error) {
        console.warn("ffmpeg 버전 확인 실패:", error)
      }
    }

    // Firebase Storage 상태 확인
    const firebaseStatus = await testFirebaseStorageConnection()

    // 환경 정보
    const environment = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    }

    // 스트림 URL 설정 상태
    const streamUrl = {
      configured: !!process.env.MJPEG_STREAM_URL,
      url: process.env.MJPEG_STREAM_URL ? "설정됨" : undefined,
    }

    return NextResponse.json({
      success: true,
      data: {
        ffmpeg: {
          ...ffmpegStatus,
          version: ffmpegVersion,
        },
        firebase: firebaseStatus,
        environment,
        streamUrl,
      },
    })
  } catch (error) {
    console.error("시스템 상태 확인 오류:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "시스템 상태 확인 실패",
      },
      { status: 500 },
    )
  }
}
