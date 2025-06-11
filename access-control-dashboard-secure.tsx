"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Camera, Users, Clock, RefreshCw, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { Navigation } from "./components/navigation"
import { SecureCameraFeed } from "./components/secure-camera-feed"
import { fetchRecentAccessRecords, type AccessRecord } from "./lib/api"

export default function SecureAccessControlDashboard() {
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadRecentRecords()
  }, [])

  const loadRecentRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const records = await fetchRecentAccessRecords(5)
      setAccessRecords(records)
    } catch (err) {
      setError("출입 기록을 불러오는데 실패했습니다.")
      console.error("출입 기록 로딩 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    loadRecentRecords()
  }

  const getStatusBadge = (status: "entry" | "exit" | "unknown") => {
    if (status === "entry") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">입장</Badge>
    } else if (status === "exit") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">퇴장</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">알 수 없음</Badge>
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

  const todayTotal = accessRecords.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
              <p className="text-gray-600 mt-1">실시간 출입 현황 및 카메라 모니터링</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-gray-900">
                {currentTime.toLocaleTimeString("ko-KR")}
              </div>
              <div className="text-gray-600">{currentTime.toLocaleDateString("ko-KR")}</div>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">오늘 총 출입</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{todayTotal}회</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">카메라 상태</CardTitle>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">정상</div>
              </CardContent>
            </Card>
          </div>

          {/* 실시간 카메라 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                실시간 카메라
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecureCameraFeed />
            </CardContent>
          </Card>

          {/* 최근 출입 기록 (요약) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  최근 출입 기록
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={refreshData} variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    새로고침
                  </Button>
                  <Link href="/records">
                    <Button size="sm">
                      전체 보기
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={refreshData} variant="outline">
                    다시 시도
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">로딩 중...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>시간</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">#{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{formatTime(record.time)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
