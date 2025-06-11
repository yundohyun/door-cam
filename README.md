# DoorCam 🚪📹

출입 관리 및 실시간 카메라 모니터링 시스템

## 주요 기능

- 📹 **실시간 MJPEG 스트림 모니터링**
- 🎥 **자동 비디오 캡처 및 저장** (로컬 ffmpeg 사용)
- 📊 **출입 기록 관리 및 통계**
- 🔥 **Firebase 기반 클라우드 저장**
- 📱 **반응형 웹 인터페이스**

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Video Processing**: 시스템 ffmpeg
- **UI Components**: shadcn/ui

## 사전 요구사항

### 1. FFmpeg 설치

DoorCam은 시스템에 설치된 로컬 FFmpeg를 사용합니다. 운영체제에 맞게 설치하세요:

#### macOS
\`\`\`bash
brew install ffmpeg
\`\`\`

#### Ubuntu/Debian
\`\`\`bash
sudo apt install ffmpeg
\`\`\`

#### Windows
[ffmpeg.org](https://ffmpeg.org/download.html)에서 다운로드 후 환경 변수 PATH에 추가하세요.

### 2. Firebase 프로젝트 설정

Firebase Console에서 프로젝트를 생성하고 Firestore 및 Storage를 활성화하세요.

## 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

\`\`\`bash
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MJPEG 스트림 URL
MJPEG_STREAM_URL=http://your-camera-ip:port/video
NEXT_PUBLIC_MJPEG_STREAM_URL=http://your-camera-ip:port/video
\`\`\`

## 설치 및 실행

\`\`\`bash
# 의존성 설치
npm install

# FFmpeg 설치 확인
npm run check:ffmpeg

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
\`\`\`

## Firebase 설정

### 1. Firestore 보안 규칙 배포
\`\`\`bash
firebase deploy --only firestore:rules
\`\`\`

### 2. Storage 보안 규칙 배포
\`\`\`bash
firebase deploy --only storage
\`\`\`

### 3. 인덱스 배포
\`\`\`bash
firebase deploy --only firestore:indexes
\`\`\`

## API 엔드포인트

- `GET /api/access-records` - 전체 출입 기록 조회
- `GET /api/access-records/recent?limit=5` - 최근 출입 기록 조회
- `GET /api/access-records/{id}` - 특정 출입 기록 상세 조회
- `GET /api/record?status=unknown&duration=15` - 비디오 캡처 및 기록 생성
- `GET /api/test-stream` - MJPEG 스트림 연결 테스트
- `GET /api/test-firebase` - Firebase Storage 연결 테스트
- `GET /api/system-status` - 시스템 상태 확인

## 프로젝트 구조

\`\`\`
doorcam/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── records/           # 출입 기록 페이지
│   └── test-record/       # 테스트 페이지
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티 함수
├── firebase/              # Firebase 설정 파일
└── scripts/               # 초기화 스크립트
\`\`\`

## 개발 모드

개발 환경에서는 Firebase 보안 규칙이 모든 읽기/쓰기를 허용하도록 설정되어 있습니다.
운영 환경에서는 반드시 적절한 인증 및 권한 검사를 추가해야 합니다.

## 문제 해결

### FFmpeg 관련 문제

1. **FFmpeg 설치 확인**: `ffmpeg -version` 명령으로 설치 여부 확인
2. **PATH 설정 확인**: FFmpeg가 시스템 PATH에 추가되었는지 확인
3. **권한 문제**: 실행 권한이 있는지 확인

### Firebase 관련 문제

1. **환경 변수 확인**: 모든 Firebase 환경 변수가 올바르게 설정되었는지 확인
2. **Storage 규칙**: Firebase Console에서 Storage 규칙이 적절히 설정되었는지 확인
3. **버킷 생성 확인**: Firebase Storage 버킷이 생성되었는지 확인

## 라이선스

MIT License
