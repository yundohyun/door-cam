"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Loader2, Wifi, WifiOff, AlertTriangle, Info, Database, Terminal } from "lucide-react"
import { Navigation } from "../../components/navigation"

interface SystemStatus {
  ffmpeg: {
    available: boolean
    path?: string
    method?: string
    version?: string
    error?: string
  }
  firebase: {
    success: boolean
    config: any
    error?: string
  }
  environment: {
    nodeVersion: string
    platform: string
    arch: string
  }
  streamUrl: {
    configured: boolean
    url?: string
  }
}

export default function TestRecordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingStream, setIsTestingStream] = useState(false)
  const [isTestingFirebase, setIsTestingFirebase] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const [firebaseStatus, setFirebaseStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)

  useEffect(() => {
    loadSystemStatus()
  }, [])

  const loadSystemStatus = async () => {
    try {
      setIsLoadingStatus(true)
      const response = await fetch("/api/system-status")
      const data = await response.json()

      if (data.success) {
        setSystemStatus(data.data)
        setFirebaseStatus(data.data.firebase.success ? "connected" : "disconnected")
      }
    } catch (err) {
      console.error("시스템 상태 로딩 실패:", err)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  const testFirebase = async () => {
    try {
      setIsTestingFirebase(true)
      setError(null)

      const response = await fetch("/api/test-firebase")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Firebase 테스트에 실패했습니다.")
      }

      setFirebaseStatus("connected")
    } catch (err) {
      setFirebaseStatus("disconnected")
      setError(err instanceof Error ? err.message : "Firebase 연결 실패")
      console.error("Firebase 테스트 실패:", err)
    } finally {
      setIsTestingFirebase(false)
    }
  }

  const testStream = async () => {
    try {
      setIsTestingStream(true)
      setError(null)

      const response = await fetch("/api/test-stream")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "스트림 테스트에 실패했습니다.")
      }

      setStreamStatus("connected")
    } catch (err) {
      setStreamStatus("disconnected")
      setError(err instanceof Error ? err.message : "스트림 연결 실패")
      console.error("스트림 테스트 실패:", err)
    } finally {
      setIsTestingStream(false)
    }
  }

  const captureVideo = async (status: "entry" | "exit" | "unknown") => {
    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch(`/api/record?status=${status}&duration=15`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "비디오 캡처에 실패했습니다.")
      }

      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
      console.error("비디오 캡처 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreamStatusIcon = () => {
    switch (streamStatus) {
      case "connected":
        return <Wifi className="h-5 w-5 text-green-600" />
      case "disconnected":
        return <WifiOff className="h-5 w-5 text-red-600" />
      default:
        return <Camera className="h-5 w-5 text-gray-400" />
    }
  }

  const getFirebaseStatusIcon = () => {
    switch (firebaseStatus) {
      case "connected":
        return <Database className="h-5 w-5 text-green-600" />
      case "disconnected":
        return <Database className="h-5 w-5 text-red-600" />
      default:
        return <Database className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: "unknown" | "connected" | "disconnected") => {
    switch (status) {
      case "connected":
        return "연결됨"
      case "disconnected":
        return "연결 실패"
      default:
        return "테스트 필요"
    }
  }

  const getFFmpegStatusBadge = () => {
    if (isLoadingStatus) {
      return <Badge variant="outline">확인 중...</Badge>
    }

    if (!systemStatus?.ffmpeg.available) {
      return <Badge variant="destructive">설치 필요</Badge>
    }

    return <Badge variant="default">설치됨</Badge>
  }

  const getFirebaseStatusBadge = () => {
    if (isLoadingStatus) {
      return <Badge variant="outline">확인 중...</Badge>
    }

    if (firebaseStatus === "connected") {
      return <Badge variant="default">연결됨</Badge>
    } else if (firebaseStatus === "disconnected") {
      return <Badge variant="destructive">연결 실패</Badge>
    }

    return <Badge variant="outline">테스트 필요</Badge>
  }

  const canCaptureVideo =
    systemStatus?.ffmpeg.available && systemStatus?.streamUrl.configured && firebaseStatus === "connected"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">시스템 테스트</h1>
            <p className="text-gray-600 mt-1">
              MJPEG 스트림 연결, Firebase Storage 및 비디오 캡처 기능을 테스트합니다.
            </p>
          </div>

          {/* 시스템 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                시스템 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">FFmpeg 상태:</span>
                    {getFFmpegStatusBadge()}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Firebase Storage:</span>
                    {getFirebaseStatusBadge()}
                  </div>

                  {systemStatus?.ffmpeg.available ? (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>경로: {systemStatus.ffmpeg.path}</div>
                      <div>설치 방법: 시스템 (로컬)</div>
                      {systemStatus.ffmpeg.version && <div>버전: {systemStatus.ffmpeg.version}</div>}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">FFmpeg 설치 필요</span>
                      </div>
                      <div className="text-sm text-amber-700 mt-1">
                        {systemStatus?.ffmpeg.error || "시스템에 ffmpeg가 설치되어 있지 않습니다."}
                      </div>
                      <div className="text-sm text-amber-700 mt-2">
                        설치 방법:
                        <br />• macOS: <code>brew install ffmpeg</code>
                        <br />• Ubuntu: <code>sudo apt install ffmpeg</code>
                        <br />• Windows:{" "}
                        <a
                          href="https://ffmpeg.org/download.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          ffmpeg.org
                        </a>
                        에서 다운로드
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">스트림 URL:</span>
                    <Badge variant={systemStatus?.streamUrl.configured ? "default" : "destructive"}>
                      {systemStatus?.streamUrl.configured ? "설정됨" : "미설정"}
                    </Badge>
                  </div>

                  {systemStatus?.firebase && !systemStatus.firebase.success && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Firebase 설정 오류</span>
                      </div>
                      <div className="text-sm text-red-700 mt-1">{systemStatus.firebase.error}</div>
                    </div>
                  )}

                  {systemStatus && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Node.js: {systemStatus.environment.nodeVersion}</div>
                      <div>플랫폼: {systemStatus.environment.platform}</div>
                      <div>아키텍처: {systemStatus.environment.arch}</div>
                      {systemStatus.firebase.config && (
                        <>
                          <div>프로젝트: {systemStatus.firebase.config.projectId}</div>
                          <div>Storage: {systemStatus.firebase.config.storageBucket}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FFmpeg 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                FFmpeg 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  DoorCam은 시스템에 설치된 로컬 FFmpeg를 사용합니다. FFmpeg는 비디오 캡처 및 처리를 위한 필수
                  도구입니다.
                </p>

                {systemStatus?.ffmpeg.available ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 text-green-800">
                      <Info className="h-4 w-4" />
                      <span className="font-medium">FFmpeg 설치됨</span>
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      경로: {systemStatus.ffmpeg.path}
                      {systemStatus.ffmpeg.version && <span> (버전: {systemStatus.ffmpeg.version})</span>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">FFmpeg 설치 필요</span>
                      </div>
                      <div className="text-sm text-amber-700 mt-1">
                        {systemStatus?.ffmpeg.error || "시스템에 ffmpeg가 설치되어 있지 않습니다."}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">운영체제별 설치 방법:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <h4 className="font-medium mb-2">macOS</h4>
                          <div className="bg-gray-800 text-white p-2 rounded text-sm font-mono">
                            brew install ffmpeg
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <h4 className="font-medium mb-2">Ubuntu/Debian</h4>
                          <div className="bg-gray-800 text-white p-2 rounded text-sm font-mono">
                            sudo apt install ffmpeg
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <h4 className="font-medium mb-2">Windows</h4>
                        <p className="text-sm mb-2">
                          <a
                            href="https://ffmpeg.org/download.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            ffmpeg.org
                          </a>
                          에서 다운로드 후 환경 변수 PATH에 추가하세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Firebase Storage 테스트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getFirebaseStatusIcon()}
                Firebase Storage 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">
                    상태:{" "}
                    <span className={firebaseStatus === "connected" ? "text-green-600" : "text-red-600"}>
                      {getStatusText(firebaseStatus)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Firebase Storage 연결 및 업로드 권한을 테스트합니다.</p>
                </div>
                <Button onClick={testFirebase} disabled={isTestingFirebase} variant="outline">
                  {isTestingFirebase ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Firebase 테스트
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 스트림 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStreamStatusIcon()}
                스트림 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">
                    상태:{" "}
                    <span className={streamStatus === "connected" ? "text-green-600" : "text-red-600"}>
                      {getStatusText(streamStatus)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    단순 HTTP 연결 테스트를 먼저 시도하고, 가능한 경우 FFmpeg 테스트도 실행합니다.
                  </p>
                </div>
                <Button onClick={testStream} disabled={isTestingStream} variant="outline">
                  {isTestingStream ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  스트림 테스트
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 비디오 캡처 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                비디오 캡처
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Button
                    onClick={() => captureVideo("entry")}
                    disabled={isLoading || !canCaptureVideo}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    입장 기록 생성
                  </Button>
                  <Button
                    onClick={() => captureVideo("exit")}
                    disabled={isLoading || !canCaptureVideo}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    퇴장 기록 생성
                  </Button>
                  <Button
                    onClick={() => captureVideo("unknown")}
                    disabled={isLoading || !canCaptureVideo}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}알 수 없음 기록 생성
                  </Button>
                </div>

                {!canCaptureVideo && (
                  <div className="text-amber-600 p-4 bg-amber-50 rounded-md">
                    ⚠️ 비디오 캡처를 위해서는 다음이 필요합니다:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>FFmpeg 설치</li>
                      <li>MJPEG 스트림 URL 설정</li>
                      <li>Firebase Storage 연결</li>
                    </ul>
                  </div>
                )}

                {error && <div className="text-red-600 p-4 bg-red-50 rounded-md">{error}</div>}

                {result && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-md">
                      <p className="text-green-600 font-medium">비디오 캡처 성공!</p>
                      <p className="text-sm text-gray-600 mt-1">
                        기록 ID: {result.id} | 상태: {result.status}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2">썸네일</h3>
                        <img
                          src={result.thumbnailUrl || "/placeholder.svg"}
                          alt="썸네일"
                          className="w-full h-auto rounded-md border border-gray-200"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">비디오</h3>
                        <video
                          src={result.videoUrl}
                          controls
                          className="w-full h-auto rounded-md border border-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
