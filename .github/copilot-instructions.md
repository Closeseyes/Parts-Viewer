# Parts Viewer - AI Agent Instructions

부품 관리 시스템(Parts Viewer) 프로젝트를 위한 AI 에이전트 가이드입니다.

## 📋 프로젝트 개요

**목적**: 부품의 Partname, 단가, Vendor, SAP Code 등을 저장하고 이력을 관리하는 데스크톱 앱

**기술 스택**:
- Frontend: React 19 + TypeScript + Vite
- Desktop: Electron 40
- Database: SQLite3
- Styling: CSS

## 🏗️ 아키텍처

### 주요 폴더 구조
```
Parts Viewer/
├── electron/           # Electron 메인 프로세스
│   ├── main.ts        # 메인 윈도우 생성, 앱 초기화
│   ├── database.ts    # SQLite DB 초기화, IPC 핸들러
│   └── preload.ts     # 보안 컨텍스트 브릿지
├── src/
│   ├── components/    # React 컴포넌트
│   │   ├── PartsList.tsx   # 부품 목록 표시
│   │   └── AddPart.tsx     # 부품 추가 폼
│   ├── pages/        # (향후 라우팅용)
│   ├── services/     # (향후 API 호출용)
│   ├── App.tsx       # 메인 App 컴포넌트
│   └── main.tsx      # React 엔트리 포인트
└── vite.config.ts    # Vite 설정
```

### 데이터 흐름
1. **메인 프로세스** (`electron/main.ts`) → Electron 윈도우 생성
2. **DB 초기화** (`electron/database.ts`) → SQLite 테이블 생성
3. **IPC 통신** → Renderer 프로세스가 IPC 핸들러 호출
4. **React UI** (`src/components/`) → 부품 데이터 표시 및 관리

### 데이터베이스 스키마
- **parts**: id, partname, vendor, price, sap_code, created_at
- **history**: id, part_id, action, price_before, price_after, changed_at

## 🚀 개발 워크플로우

### 시작하기
```bash
npm install              # 의존성 설치
npm run dev             # Vite 개발 서버 시작 (http://localhost:5173)
npm run electron        # 별도 터미널에서 Electron 앱 시작
npm run electron-dev    # 통합 개발 모드 (권장)
```

### 빌드 및 배포
```bash
npm run build           # React 프로덕션 빌드
npm run electron-build  # Electron 앱 빌드 (Windows 설치 파일)
```

## 🔑 핵심 패턴

### 1️⃣ IPC 통신 (Electron ↔ React)
**파일**: `electron/database.ts`, `electron/preload.ts`

Renderer 프로세스에서 DB 접근:
```typescript
// React 컴포넌트에서 사용
const parts = await (window as any).electron.getParts();
await (window as any).electron.addPart(partData);
```

새로운 DB 작업 추가 시:
1. `database.ts`에서 `ipcMain.handle('operation-name', async (event, args) => {...})`
2. `preload.ts`에서 `contextBridge.exposeInMainWorld`에 추가
3. React 컴포넌트에서 `window.electron.operationName()` 호출

### 2️⃣ 부품 데이터 관리
**파일**: `src/components/PartsList.tsx`, `src/components/AddPart.tsx`

- PartsList: 부품 조회, 삭제 기능
- AddPart: 새 부품 추가 폼 (UUID 자동 생성)

### 3️⃣ 상태 관리
- React의 `useState` 사용 (간단한 전역 상태)
- 부품 추가 후 목록 새로고침: `refreshKey` 상태 토글

## ⚠️ 중요 개발 규칙

1. **타입스크립트 사용**: 모든 `.ts`/`.tsx` 파일에서 타입 선언 필수
2. **IPC 보안**: `preload.ts`를 통해서만 DB 접근 (contextIsolation=true)
3. **SQLite 경로**: `electron.app.getPath('userData')`에 자동 저장
4. **UUID 생성**: `uuid` 패키지로 모든 부품에 고유 ID 할당
5. **한글 지원**: 모든 UI 텍스트는 한글 기본 제공

## 🔧 자주 하는 작업

### 새 기능 추가 (예: 부품 검색)
1. `electron/database.ts`에 IPC 핸들러 추가: `ipcMain.handle('search-parts'...)`
2. `electron/preload.ts`에 메서드 노출
3. `src/components/` 또는 `src/pages/`에 UI 컴포넌트 생성
4. `src/App.tsx`에 라우팅 또는 상태 추가

### 데이터베이스 마이그레이션
- 새 컬럼 추가: `createTables()` 함수의 CREATE TABLE IF NOT EXISTS 쿼리 수정
- 데이터 기존 데이터는 그대로 유지됨 (안전)

### 스타일 추가
- 컴포넌트별 CSS 파일 생성 (예: `PartsList.css`)
- `App.css`에 전역 스타일 정의

## 📚 주요 파일 참조

| 파일 | 역할 |
|------|------|
| [electron/main.ts](electron/main.ts) | Electron 윈도우 생성, 라이프사이클 |
| [electron/database.ts](electron/database.ts) | DB 초기화 및 IPC 핸들러 |
| [electron/preload.ts](electron/preload.ts) | 보안 IPC 브릿지 |
| [src/App.tsx](src/App.tsx) | 메인 UI 레이아웃 |
| [src/components/PartsList.tsx](src/components/PartsList.tsx) | 부품 목록 표시 |
| [src/components/AddPart.tsx](src/components/AddPart.tsx) | 부품 추가 폼 |

## 🐛 문제 해결

### "electron.app is not defined"
→ `electron/main.ts`에서 `app` 모듈 import 확인

### IPC 호출 오류
→ `window` 타입이 `electron` 속성을 인식하지 못함
→ `preload.ts`의 `contextBridge.exposeInMainWorld` 확인

### SQLite 오류
→ 첫 실행 시 `parts.db` 파일이 사용자 디렉토리에 생성됨
→ 데이터 경로: `C:\Users\[username]\AppData\Roaming\parts-viewer\`

---

**마지막 업데이트**: 2026년 1월 21일
