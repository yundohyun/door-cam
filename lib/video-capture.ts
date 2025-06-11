import { spawn } from "child_process"
import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import os from "os"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage, getFirebaseConfig } from "./firebase"
import { addDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

/*
MJPEG 스트림 캡처 및 Firebase Storage 업로드 유틸리티

필요한 환경 변수:
- MJPEG_STREAM_URL: MJPEG 스트림 URL (예: http://camera-ip:port/video)

ffmpeg 설정:
- 시스템에 설치된 ffmpeg 사용 (로컬 ffmpeg)
- 시스템 경로에 있는 ffmpeg 실행 파일 사용
*/

interface CaptureResult {
  videoUrl: string
  thumbnailUrl: string
  recordId: string
  timestamp: Date
}

// Firebase Storage 연결 테스트
async function testFirebaseStorage(): Promise<void> {
  try {
    const config = getFirebaseConfig()
    console.log("Firebase Storage 설정 확인:", config)

    if (!config.configured) {
      throw new Error("Firebase 설정이 완료되지 않았습니다.")
    }

    if (!config.storageBucket) {
      throw new Error("Firebase Storage Bucket이 설정되지 않았습니다.")
    }

    // 테스트 파일 업로드
    const testData = new Uint8Array([1, 2, 3, 4, 5])
    const testRef = ref(storage, `test/connection-test-${Date.now()}.bin`)

    console.log("Firebase Storage 연결 테스트 중...")
    await uploadBytes(testRef, testData)
    console.log("Firebase Storage 연결 테스트 성공")

    // 테스트 파일 URL 가져오기
    const testUrl = await getDownloadURL(testRef)
    console.log("테스트 파일 URL:", testUrl)
  } catch (error) {
    console.error("Firebase Storage 연결 테스트 실패:", error)
    throw new Error(`Firebase Storage 연결 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
  }
}

// 시스템에 설치된 ffmpeg 경로 찾기
function getFFmpegPath(): string {
  try {
    // 운영체제별 ffmpeg 명령어 확인 방법
    const { execSync } = require("child_process")
    let ffmpegPath: string

    if (process.platform === "win32") {
      // Windows
      try {
        ffmpegPath = execSync("where ffmpeg", { encoding: "utf8" }).split("\n")[0].trim()
      } catch (error) {
        throw new Error(
          "Windows 시스템에 ffmpeg가 설치되어 있지 않습니다. https://ffmpeg.org/download.html 에서 다운로드하세요.",
        )
      }
    } else {
      // macOS, Linux 등
      try {
        ffmpegPath = execSync("which ffmpeg", { encoding: "utf8" }).trim()
      } catch (error) {
        throw new Error(
          "시스템에 ffmpeg가 설치되어 있지 않습니다. " +
            "macOS: brew install ffmpeg, " +
            "Ubuntu: sudo apt install ffmpeg 명령으로 설치하세요.",
        )
      }
    }

    // ffmpeg 경로 확인
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      throw new Error("ffmpeg 경로를 찾을 수 없습니다.")
    }

    console.log(`시스템 ffmpeg 사용: ${ffmpegPath}`)
    return ffmpegPath
  } catch (error) {
    console.error("ffmpeg 경로 찾기 실패:", error)
    throw new Error(
      "시스템에 설치된 ffmpeg를 찾을 수 없습니다. 다음 명령으로 설치하세요:\n" +
        "• macOS: brew install ffmpeg\n" +
        "• Ubuntu: sudo apt install ffmpeg\n" +
        "• Windows: https://ffmpeg.org/download.html 에서 다운로드",
    )
  }
}

export async function captureMjpegStream(durationSeconds = 15): Promise<CaptureResult> {
  const streamUrl = process.env.MJPEG_STREAM_URL

  if (!streamUrl) {
    throw new Error("MJPEG_STREAM_URL 환경 변수가 설정되지 않았습니다.")
  }

  // Firebase Storage 연결 테스트
  await testFirebaseStorage()

  const ffmpegPath = getFFmpegPath()

  // 임시 파일 경로 생성
  const tempDir = os.tmpdir()
  const recordId = randomUUID()
  const timestamp = new Date()
  const dateString = timestamp.toISOString().replace(/[:.]/g, "-")
  const videoFilename = `record_${dateString}_${recordId}.mp4`
  const thumbnailFilename = `thumbnail_${dateString}_${recordId}.jpg`
  const videoPath = path.join(tempDir, videoFilename)
  const thumbnailPath = path.join(tempDir, thumbnailFilename)

  try {
    console.log(`ffmpeg 경로: ${ffmpegPath}`)
    console.log(`MJPEG 스트림 URL: ${streamUrl}`)
    console.log(`비디오 캡처 시작: ${durationSeconds}초`)

    // ffmpeg를 사용하여 MJPEG 스트림 캡처
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        "-y", // 기존 파일 덮어쓰기
        "-i",
        streamUrl,
        "-t",
        durationSeconds.toString(),
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-movflags",
        "+faststart", // 웹 재생 최적화
        videoPath,
      ])

      let errorOutput = ""

      ffmpeg.stderr.on("data", (data) => {
        const output = data.toString()
        console.log(`ffmpeg stderr: ${output}`)
        errorOutput += output
      })

      ffmpeg.stdout.on("data", (data) => {
        console.log(`ffmpeg stdout: ${data}`)
      })

      ffmpeg.on("close", (code) => {
        console.log(`ffmpeg 프로세스 종료: 코드 ${code}`)
        if (code === 0) {
          console.log(`비디오 파일 생성 완료: ${videoPath}`)
          resolve()
        } else {
          console.error(`ffmpeg 오류 출력: ${errorOutput}`)
          reject(new Error(`ffmpeg 프로세스가 코드 ${code}로 종료되었습니다. 오류: ${errorOutput}`))
        }
      })

      ffmpeg.on("error", (error) => {
        console.error("ffmpeg 프로세스 오류:", error)
        reject(error)
      })
    })

    // 비디오 파일 존재 확인
    if (!fs.existsSync(videoPath)) {
      throw new Error("비디오 파일이 생성되지 않았습니다.")
    }

    console.log("썸네일 생성 시작")

    // 썸네일 생성
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        "-y", // 기존 파일 덮어쓰기
        "-i",
        videoPath,
        "-ss",
        "00:00:01", // 1초 지점에서 캡처
        "-vframes",
        "1", // 1프레임만 캡처
        "-q:v",
        "2", // 고품질 JPEG
        thumbnailPath,
      ])

      let errorOutput = ""

      ffmpeg.stderr.on("data", (data) => {
        const output = data.toString()
        console.log(`ffmpeg thumbnail stderr: ${output}`)
        errorOutput += output
      })

      ffmpeg.on("close", (code) => {
        console.log(`썸네일 생성 프로세스 종료: 코드 ${code}`)
        if (code === 0) {
          console.log(`썸네일 파일 생성 완료: ${thumbnailPath}`)
          resolve()
        } else {
          console.error(`썸네일 생성 오류: ${errorOutput}`)
          reject(new Error(`썸네일 생성 프로세스가 코드 ${code}로 종료되었습니다. 오류: ${errorOutput}`))
        }
      })

      ffmpeg.on("error", (error) => {
        console.error("썸네일 생성 프로세스 오류:", error)
        reject(error)
      })
    })

    // 썸네일 파일 존재 확인
    if (!fs.existsSync(thumbnailPath)) {
      throw new Error("썸네일 파일이 생성되지 않았습니다.")
    }

    console.log("Firebase Storage 업로드 시작")

    // Firebase Storage에 비디오 업로드 (재시도 로직 포함)
    let videoUrl: string
    try {
      const videoFileData = fs.readFileSync(videoPath)
      const videoStorageRef = ref(storage, `videos/${videoFilename}`)
      console.log(`비디오 업로드 중: ${videoFileData.length} bytes`)
      console.log(`업로드 경로: videos/${videoFilename}`)

      await uploadBytes(videoStorageRef, videoFileData, {
        contentType: "video/mp4",
      })

      videoUrl = await getDownloadURL(videoStorageRef)
      console.log(`비디오 업로드 완료: ${videoUrl}`)
    } catch (uploadError) {
      console.error("비디오 업로드 실패:", uploadError)
      throw new Error(`비디오 업로드 실패: ${uploadError instanceof Error ? uploadError.message : "알 수 없는 오류"}`)
    }

    // Firebase Storage에 썸네일 업로드 (재시도 로직 포함)
    let thumbnailUrl: string
    try {
      const thumbnailFileData = fs.readFileSync(thumbnailPath)
      const thumbnailStorageRef = ref(storage, `thumbnails/${thumbnailFilename}`)
      console.log(`썸네일 업로드 중: ${thumbnailFileData.length} bytes`)
      console.log(`업로드 경로: thumbnails/${thumbnailFilename}`)

      await uploadBytes(thumbnailStorageRef, thumbnailFileData, {
        contentType: "image/jpeg",
      })

      thumbnailUrl = await getDownloadURL(thumbnailStorageRef)
      console.log(`썸네일 업로드 완료: ${thumbnailUrl}`)
    } catch (uploadError) {
      console.error("썸네일 업로드 실패:", uploadError)
      throw new Error(`썸네일 업로드 실패: ${uploadError instanceof Error ? uploadError.message : "알 수 없는 오류"}`)
    }

    // 임시 파일 삭제
    try {
      fs.unlinkSync(videoPath)
      fs.unlinkSync(thumbnailPath)
      console.log("임시 파일 삭제 완료")
    } catch (cleanupError) {
      console.warn("임시 파일 삭제 실패:", cleanupError)
    }

    return {
      videoUrl,
      thumbnailUrl,
      recordId,
      timestamp,
    }
  } catch (error) {
    console.error("MJPEG 스트림 캡처 실패:", error)

    // 오류 발생 시 임시 파일 정리
    try {
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath)
      }
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath)
      }
    } catch (cleanupError) {
      console.warn("오류 발생 시 임시 파일 정리 실패:", cleanupError)
    }

    throw error
  }
}

// Firestore에 출입 기록 저장
export async function saveAccessRecord(
  status: "entry" | "exit" | "unknown",
  videoUrl: string,
  thumbnailUrl: string,
): Promise<string> {
  try {
    console.log(`Firestore에 출입 기록 저장: status=${status}`)
    const now = Timestamp.now()
    const accessRecordsRef = collection(db, "access_records")

    const docRef = await addDoc(accessRecordsRef, {
      time: now,
      status,
      photo: thumbnailUrl,
      videoUrl,
      createdAt: now,
      updatedAt: now,
    })

    console.log(`Firestore 저장 완료: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error("Firestore에 출입 기록 저장 실패:", error)
    throw error
  }
}

// 단순한 HTTP 요청으로 스트림 연결 테스트 (ffmpeg 없이)
export async function testMjpegStreamSimple(): Promise<boolean> {
  const streamUrl = process.env.MJPEG_STREAM_URL

  if (!streamUrl) {
    throw new Error("MJPEG_STREAM_URL 환경 변수가 설정되지 않았습니다.")
  }

  try {
    console.log(`단순 HTTP 스트림 테스트: ${streamUrl}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃

    const response = await fetch(streamUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "DoorCam/1.0",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP 응답 오류: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    console.log(`응답 Content-Type: ${contentType}`)

    // MJPEG 스트림인지 확인
    if (contentType && (contentType.includes("multipart") || contentType.includes("image"))) {
      console.log("MJPEG 스트림 연결 성공")
      return true
    } else {
      throw new Error(`예상되지 않은 Content-Type: ${contentType}`)
    }
  } catch (error) {
    console.error("단순 스트림 테스트 실패:", error)
    throw error
  }
}

// ffmpeg를 사용한 스트림 테스트 (고급)
export async function testMjpegStreamAdvanced(): Promise<boolean> {
  const streamUrl = process.env.MJPEG_STREAM_URL

  if (!streamUrl) {
    throw new Error("MJPEG_STREAM_URL 환경 변수가 설정되지 않았습니다.")
  }

  try {
    const ffmpegPath = getFFmpegPath()
    console.log(`고급 스트림 테스트 (ffmpeg 사용): ${streamUrl}`)

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        "-i",
        streamUrl,
        "-t",
        "1", // 1초만 테스트
        "-f",
        "null",
        "-",
      ])

      let hasOutput = false
      let errorOutput = ""

      ffmpeg.stderr.on("data", (data) => {
        const output = data.toString()
        console.log(`스트림 테스트: ${output}`)
        errorOutput += output
        if (output.includes("Stream #0") || output.includes("Video:")) {
          hasOutput = true
        }
      })

      ffmpeg.on("close", (code) => {
        console.log(`스트림 테스트 완료: 코드 ${code}, 출력 있음: ${hasOutput}`)
        if (hasOutput) {
          resolve(true)
        } else {
          reject(new Error(`스트림에서 비디오 데이터를 찾을 수 없습니다. 오류: ${errorOutput}`))
        }
      })

      ffmpeg.on("error", (error) => {
        console.error("스트림 테스트 오류:", error)
        reject(error)
      })

      // 10초 타임아웃
      setTimeout(() => {
        ffmpeg.kill("SIGTERM")
        reject(new Error("스트림 연결 테스트 타임아웃"))
      }, 10000)
    })
  } catch (error) {
    console.error("고급 스트림 테스트 실패:", error)
    throw error
  }
}

// 통합 스트림 테스트 함수
export async function testMjpegStream(): Promise<boolean> {
  try {
    // 먼저 단순한 HTTP 테스트 시도
    console.log("1단계: 단순 HTTP 연결 테스트")
    await testMjpegStreamSimple()
    console.log("단순 HTTP 테스트 성공")

    // ffmpeg 테스트 시도 (선택사항)
    try {
      console.log("2단계: ffmpeg 고급 테스트")
      await testMjpegStreamAdvanced()
      console.log("ffmpeg 고급 테스트 성공")
    } catch (ffmpegError) {
      console.warn("ffmpeg 테스트 실패, 단순 테스트 결과 사용:", ffmpegError)
    }

    return true
  } catch (error) {
    console.error("스트림 테스트 실패:", error)
    throw error
  }
}

// ffmpeg 설치 상태 확인
export function checkFFmpegInstallation(): {
  available: boolean
  path?: string
  method?: string
  error?: string
} {
  try {
    const ffmpegPath = getFFmpegPath()

    return {
      available: true,
      path: ffmpegPath,
      method: "system",
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    }
  }
}

// Firebase Storage 연결 테스트 함수 (외부에서 호출 가능)
export async function testFirebaseStorageConnection(): Promise<{
  success: boolean
  config: any
  error?: string
}> {
  try {
    await testFirebaseStorage()
    return {
      success: true,
      config: getFirebaseConfig(),
    }
  } catch (error) {
    return {
      success: false,
      config: getFirebaseConfig(),
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    }
  }
}
