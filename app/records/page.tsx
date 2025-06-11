"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, Filter, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { Navigation } from "../../components/navigation"
import { fetchAccessRecords, type AccessRecord } from "../../lib/api"

export default function RecordsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAccessRecords()
  }, [])

  const loadAccessRecords = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const records = await fetchAccessRecords()
      setAccessRecords(records)
    } catch (err) {
      setError("출입 기록을 불러오는데 실패했습니다.")
      console.error("출입 기록 로딩 실패:", err)
    } finally {
      setIsLoading(false)
    }
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

  const filteredRecords = accessRecords.filter((record) => record.id.toString().includes(searchTerm))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">출입 기록</h1>
            <p className="text-gray-600 mt-1">전체 출입 기록을 확인하고 관리할 수 있습니다</p>
          </div>

          {/* 검색 및 필터 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                검색 및 필터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="ID로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <Button variant="outline" disabled={isLoading}>
                  <Filter className="h-4 w-4 mr-2" />
                  필터
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 출입 기록 테이블 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  출입 기록 ({filteredRecords.length}건)
                </CardTitle>
                <Button onClick={loadAccessRecords} variant="outline" size="sm" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  새로고침
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={loadAccessRecords} variant="outline">
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
                      <TableHead>상세</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">#{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{formatTime(record.time)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <Link href={`/records/${record.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              보기
                            </Button>
                          </Link>
                        </TableCell>
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
