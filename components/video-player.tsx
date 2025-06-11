"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Loader2 } from "lucide-react"

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  onDownload?: () => void
}

export function VideoPlayer({ src, poster, className = "", onDownload }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleLoadStart = () => {
    setIsLoading(true)
    setHasError(false)
  }

  const handleCanPlay = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handlePlayStateChange = () => {
    if (videoRef.current) {
      setIsPlaying(!videoRef.current.paused)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      videoRef.current.currentTime = newTime
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (hasError) {
    return (
      <div className={`aspect-video bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-gray-400">비디오를 로드할 수 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`aspect-video bg-gray-900 rounded-lg relative overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlayStateChange}
        onPause={handlePlayStateChange}
        preload="metadata"
      />

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-white mx-auto mb-2 animate-spin" />
            <p className="text-white text-sm">비디오 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 컨트롤 오버레이 */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-200 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}
      >
        {/* 중앙 재생 버튼 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button onClick={handlePlay} size="lg" className="bg-black/50 hover:bg-black/70 text-white border-white/20">
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
        </div>

        {/* 하단 컨트롤 바 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* 진행률 바 */}
          <div className="w-full h-2 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={handleSeek}>
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* 컨트롤 버튼들 */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Button onClick={handlePlay} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button onClick={toggleMute} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onDownload && (
                <Button onClick={onDownload} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Download className="h-4 w-4" />
                </Button>
              )}

              <Button onClick={toggleFullscreen} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">RECORDED</span>
      </div>
    </div>
  )
}
