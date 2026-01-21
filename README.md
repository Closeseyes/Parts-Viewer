# 📦 Parts Viewer - 부품 관리 시스템

부품의 Partname, 단가, Vendor, SAP Code 등을 저장하고 이력을 관리하는 **Windows 데스크톱 애플리케이션**입니다.

## ✨ 주요 기능

- ✅ 부품 정보 입력 및 저장 (Partname, 단가, Vendor, SAP Code)
- ✅ 부품 목록 조회 및 검색
- ✅ 부품 삭제 및 수정 (향후)
- ✅ 이력 추적 (향후 - 가격 변동 기록)
- ✅ SQLite 로컬 데이터베이스

## 🚀 시작하기

### 사전 요구사항
- Node.js 16+ 
- npm 또는 yarn
- Windows OS

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 모드 시작 (권장)
npm run electron-dev

# 또는 별도 터미널에서 각각 실행
# 터미널 1
npm run dev

# 터미널 2
npm run electron
```

### 프로덕션 빌드

```bash
# Windows 설치 파일(.exe) 생성
npm run electron-build
```

## 📂 프로젝트 구조

```
Parts Viewer/
├── electron/               # Electron 메인 프로세스
│   ├── main.ts            # 앱 메인 진입점
│   ├── database.ts        # SQLite 관리 및 IPC 핸들러
│   └── preload.ts         # 보안 컨텍스트 브릿지
├── src/
│   ├── components/        # React 컴포넌트
│   │   ├── AddPart.tsx     # 부품 추가 폼
│   │   └── PartsList.tsx   # 부품 목록 표시
│   ├── App.tsx            # 메인 애플리케이션
│   └── main.tsx           # React 엔트리 포인트
├── package.json           # 프로젝트 설정
└── vite.config.ts         # Vite 빌드 설정
```

## 🏗️ 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Desktop** | Electron 40 |
| **Frontend** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Database** | SQLite3 |
| **Styling** | CSS |

## 📖 사용 방법

### 1. 부품 추가
- "새 부품 추가" 폼에서 다음 정보 입력:
  - **부품명**: 부품의 이름
  - **공급업체**: Vendor 이름
  - **단가**: 부품의 가격 (숫자)
  - **SAP 코드**: SAP 시스템 코드 (선택)
- "추가" 버튼 클릭

### 2. 부품 목록 조회
- "부품 목록" 테이블에서 모든 저장된 부품 확인
- 자동으로 최신 등록순으로 정렬

### 3. 부품 삭제
- 부품 행의 "삭제" 버튼 클릭
- 확인 창에서 "확인"

## 🗄️ 데이터베이스

### Parts 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | 고유 ID (UUID) |
| partname | TEXT | 부품명 |
| vendor | TEXT | 공급업체 |
| price | REAL | 단가 |
| sap_code | TEXT | SAP 코드 |
| created_at | DATETIME | 생성 시간 |

### History 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | 고유 ID |
| part_id | TEXT | 부품 ID (외래키) |
| action | TEXT | 액션 유형 |
| price_before | REAL | 변경 전 가격 |
| price_after | REAL | 변경 후 가격 |
| changed_at | DATETIME | 변경 시간 |

## 🔧 개발

### npm 스크립트

```bash
npm run dev              # Vite 개발 서버 시작
npm run build            # React 프로덕션 빌드
npm run lint             # ESLint 실행
npm run electron         # Electron 앱 시작
npm run electron-dev     # 통합 개발 모드 (권장)
npm run electron-build   # Electron 앱 빌드
```

### IDE 추천
- **Visual Studio Code** (권장)
  - Extensions: ES7+ React/Redux/React-Native snippets
  - Extensions: SQLite Viewer

## 📝 라이선스

MIT

## 👨‍💻 기여

이슈 및 PR 환영합니다!

---

**마지막 업데이트**: 2026년 1월 21일
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
