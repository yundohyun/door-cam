"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Clock, Camera, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { Navigation } from "../../../components/navigation"
import { fetchAccessRecordDetail, type AccessRecordDetail } from "../../../lib/api"
import { VideoPlayer } from "../../../components/video-player"

export default function RecordDetailPage({ params }: { params: { id: string } }) {
  const [record, setRecord] = useState<AccessRecordDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)

  useEffect(() => {
    loadRecordDetail()
  }, [params.id])

  const loadRecordDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const recordDetail = await fetchAccessRecordDetail(params.id)
      setRecord(recordDetail)
    } catch (err) {
      setError("출입 기록 상세 정보를 불러오는데 실패했습니다.")
      console.error("출입 기록 상세 로딩 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadVideo = () => {
    if (record?.videoUrl) {
      const link = document.createElement("a")
      link.href = record.videoUrl
      link.download = `record_${record.id}_${new Date(record.time).toISOString().slice(0, 10)}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleString("ko-KR")
    } catch {
      return timeString
    }
  }

  const formatVideoTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusBadge = (status: "entry" | "exit" | "unknown") => {
    if (status === "entry") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-lg px-3 py-1">입장</Badge>
    } else if (status === "exit") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-lg px-3 py-1">퇴장</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-lg px-3 py-1">알 수 없음</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">로딩 중...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <p className="text-red-600 mb-4">{error || "출입 기록을 찾을 수 없습니다."}</p>
              <div className="flex gap-4 justify-center">
                <Link href="/records">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    목록으로
                  </Button>
                </Link>
                <Button onClick={loadRecordDetail}>다시 시도</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center gap-4">
            <Link href="/records">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">출입 기록 상세</h1>
              <p className="text-gray-600 mt-1">출입 기록 #{record.id}의 상세 정보</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <img
                    src={record.photo || "/placeholder.svg?height=80&width=80"}
                    alt={`Record #${record.id}`}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=80&width=80"
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-bold">출입 기록 #{record.id}</h3>
                    <p className="text-gray-600">출입 기록 상세 정보</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      출입시간
                    </div>
                    <div className="font-mono font-medium">{formatTime(record.time)}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">출입상태</div>
                    <div>{getStatusBadge(record.status)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 녹화 영상 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  녹화 영상
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <VideoPlayer
                    src={record.videoUrl}
                    poster={record.photo}
                    onDownload={downloadVideo}
                    onDuration={setDuration}
                  />

                  <div className="flex items-center justify-center gap-4">
                    <Button onClick={downloadVideo} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      다운로드
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 추가 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>추가 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">출입 방식</h4>
                  <p className="text-gray-600">자동 감지</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">인증 상태</h4>
                  <Badge className="bg-green-100 text-green-800">정상 인증</Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">영상 길이</h4>
                  <p className="text-gray-600">{duration > 0 ? formatVideoTime(duration) : "확인 중..."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 썸네일 이미지 (별도 섹션) */}
          <Card>
            <CardHeader>
              <CardTitle>캡처 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-600">썸네일</h4>
                  <img
                    src={record.photo || "/placeholder.svg?height=200&width=300"}
                    alt="썸네일"
                    className="w-full h-auto rounded-md border border-gray-200 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=200&width=300"
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
