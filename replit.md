# Travel Quote Calculator

## Overview

A travel quote calculator application for generating custom trip estimates. The system allows users to configure various travel options (villa stays, vehicle rentals, eco-guides, and tour guides) and calculates pricing based on complex rules including day-of-week pricing, vehicle types, and group sizes. Users can save quotes to a database for future reference.

### Villa Management System (2025-01-31 추가)
- **관리자 빌라 관리**: `/admin/villas` 페이지에서 관리자가 직접 풀빌라 추가/수정/삭제
- **빌라 가격 체계**: weekdayPrice(평일), fridayPrice(금요일), weekendPrice(주말), holidayPrice(공휴일/베트남 공휴일)
- **빌라 선택 갤러리**: Home 페이지에서 사용자가 빌라 선택 시 해당 빌라의 가격으로 자동 견적 계산
- **견적 저장**: 저장된 견적에 villaId, villaName 포함

### Admin Site Settings (2026-02-07 추가)
- **히어로 텍스트 편집**: `/admin/settings` 페이지에서 관리자가 홈 화면 제목, 부제목, 설명 텍스트 수정
- **SEO 메타태그 편집**: 검색엔진(구글/네이버)에 표시되는 title, description, keywords 수정 가능
- **동적 SEO 주입**: 서버에서 홈페이지 요청 시 DB 설정값을 HTML meta 태그에 동적 주입 (og-tags.ts, index.ts)
- **설정 키**: hero_title, hero_subtitle, hero_description, seo_title, seo_description, seo_keywords
- **API**: GET /api/site-settings, PUT /api/admin/site-settings

### AI Travel Planner Enhanced (2026-02-08 업그레이드)
- **초개인화 입력**: 동반자 유형(혼자/커플/가족/친구/워크샵), 여행 스타일(빡빡한/밸런스/휴식), 도착 시간(오전/낮/오후/저녁)
- **숙소 동선 최적화**: 빌라 선택 시 위치 기반으로 가까운 장소 우선 배치
- **계절 반영**: 우기(5~10월) 실내 활동 우선, 건기(11~4월) 야외 활동 우선
- **확장 응답**: 예상 비용(항목별/총합), 이동시간, GPS 좌표, 차량 추천, 날씨 참고
- **결과 UI**: 드래그앤드롭 일정 편집, Leaflet 경로 지도, 접기/펼치기, 이미지 저장
- **예약 CTA**: 카톡 차량 예약 링크, 가계부 연동 버튼
- **여행목적**: 식도락, 힐링, 골프, 관광, 문화, 가족, 야간, 카지노
- **협력업체 우선배치**: isPartner=true인 장소(식당, 마사지, 골프장 등) AI 일정에 우선 포함, 앰버색 강조+뱃지
- **일정 저장/불러오기**: 로그인 사용자 일정 DB 저장, 목록 확인, 다시 보기, 삭제 (saved_travel_plans 테이블)
- **로그인 홍보**: 비로그인 시 "로그인하면 일정 자동 저장" 안내 카드 표시
- **API**: POST/GET/DELETE /api/saved-travel-plans (인증 필요)
- **API 확장**: POST /api/travel-plan에 companion, travelStyle, arrivalTime, villaName, villaLat, villaLng 추가

### Customer Service Chat (2026-02-09 추가)
- **실시간 1:1 채팅**: WebSocket(/ws/support) 기반 고객-관리자 실시간 채팅
- **플로팅 위젯**: 모든 페이지 하단에 채팅 버튼, 클릭 시 채팅창 오픈
- **비로그인 지원**: localStorage visitorId 기반 익명 채팅 가능, 로그인 시 userId 연동
- **관리자 페이지**: `/admin/chat`에서 모든 채팅방 목록, 선택 후 실시간 답변
- **푸시 알림**: 새 채팅 요청 시 관리자에게 web-push 알림 발송
- **읽지 않은 메시지**: unreadByAdmin/unreadByVisitor 카운터로 읽지 않은 메시지 표시
- **채팅방 관리**: 관리자가 대화 종료(close) 가능
- **DB 테이블**: customer_chat_rooms, customer_chat_messages
- **API**: POST /api/customer-chat/room, GET /api/customer-chat/room/:id/messages, GET /api/admin/customer-chat/rooms, PATCH /api/admin/customer-chat/rooms/:id/close

### Email Verification System (2026-02-04 추가)
- **이메일 인증 필수**: 이메일/비밀번호 회원가입 시 6자리 인증 코드를 이메일로 발송
- **인증 코드 만료**: 30분 후 자동 만료
- **미인증 로그인 차단**: 이메일 인증을 완료하지 않은 사용자는 로그인 불가
- **재발송 기능**: 인증 코드 재발송 가능
- **자동 로그인**: 인증 완료 시 자동으로 로그인 처리
- **DB 필드**: users 테이블에 emailVerified, emailVerificationToken, emailVerificationExpires 추가

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Hook Form for form state, TanStack Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for smooth UI transitions
- **Build Tool**: Vite with custom Replit plugins for development

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: REST API with typed routes defined in `shared/routes.ts`
- **Validation**: Zod schemas for request/response validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle schemas and Zod validation
  routes.ts       # API contract definitions
```

### Data Flow
1. Frontend forms collect user input with react-hook-form
2. Zod schemas validate input on both client and server
3. TanStack Query mutations call REST endpoints
4. Server calculates quotes using business logic in routes.ts
5. Results stored via Drizzle ORM to PostgreSQL

### Key Design Patterns
- **Shared Schema Pattern**: Database schemas and validation schemas defined once in `shared/` and used by both client and server
- **Type-safe API Contract**: Route definitions with method, path, and response schemas centralized in `shared/routes.ts`
- **Component Composition**: Modular UI built from shadcn/ui primitives

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries
- **drizzle-kit**: Database migrations via `db:push` command

### UI Component Library
- **shadcn/ui**: Pre-built accessible components using Radix UI primitives
- **Radix UI**: Headless UI primitives for dialogs, dropdowns, switches, etc.
- **Tailwind CSS**: Utility-first styling with custom theme configuration

### Date Handling
- **date-fns**: Date manipulation for check-in/out calculations and pricing logic
- **react-day-picker**: Calendar component for date selection

### Development Tools
- **Vite**: Development server with HMR
- **esbuild**: Production bundling for server code
- **tsx**: TypeScript execution for development