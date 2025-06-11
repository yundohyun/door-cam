"use client"

import { useState, useEffect } from "react"
import { Camera, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SecureCameraFeedProps {
  className?: string
}

export function SecureCameraFeed({ className }: SecureCameraFeedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string>("")

  useEffect(() => {
    // 보안 강화 방법: API 프록시 사용
    setStreamUrl("/api/camera-stream")

    // 또는 환경 변수 직접 사용 (보안 주의)
    // if (process.env.NEXT_PUBLIC_MJPEG_STREAM_URL) {
    //   setStreamUrl(process.env.NEXT_PUBLIC_MJPEG_STREAM_URL)
    // }
  }, [])

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const refreshStream = () => {
    setIsLoading(true)
    setHasError(false)
    // 이미지를 다시 로드하기 위해 URL에 타임스탬프 추가
    const timestamp = new Date().getTime()
    setStreamUrl(`/api/camera-stream?t=${timestamp}`)
  }

  if (!streamUrl) {
    return (
      <div
        className={`aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden ${className}`}
      >
        <div className="text-center">
          <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">카메라 설정 필요</p>
          <p className="text-gray-500 text-sm mt-2">스트림 URL을 설정해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden ${className}`}
    >
      {!hasError ? (
        <>
          <img
            src={streamUrl || "/placeholder.svg"}
            alt="실시간 카메라 피드"
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: isLoading ? "none" : "block" }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-400">카메라 연결 중...</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 text-lg">카메라 연결 실패</p>
            <p className="text-gray-500 text-sm mt-2 mb-4">스트림을 불러올 수 없습니다</p>
            <Button onClick={refreshStream} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </div>
      )}

      {!hasError && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">LIVE</span>
        </div>
      )}

      {!hasError && (
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={refreshStream}
            variant="outline"
            size="sm"
            className="bg-black/50 border-white/20 text-white hover:bg-black/70"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
