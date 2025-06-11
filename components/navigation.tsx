"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, FileText, Camera } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Camera className="h-6 w-6 text-blue-600" />
              DoorCam
            </Link>
            <div className="flex space-x-4">
              <Link href="/">
                <Button variant={pathname === "/" ? "default" : "ghost"} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  대시보드
                </Button>
              </Link>
              <Link href="/records">
                <Button
                  variant={pathname.startsWith("/records") ? "default" : "ghost"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  출입 기록
                </Button>
              </Link>
              <Link href="/test-record">
                <Button variant={pathname === "/test-record" ? "default" : "ghost"} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  테스트
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
