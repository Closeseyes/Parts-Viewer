# Parts Viewer v0.1.0 배포 가이드

## 🚀 빠른 시작

### 방법 1: 배치 파일 사용 (권장)
```bash
Parts Viewer.bat
```
더블클릭하면 앱이 자동으로 실행됩니다.

### 방법 2: 수동 실행
```bash
node ./node_modules/electron/cli.js dist-electron/main.js
```

## 📋 요구사항

- **Node.js**: 18.x 이상 필요
- **Windows**: 7 이상 (권장: Windows 10/11)
- **디스크 공간**: 약 500MB (node_modules 포함)

## 📁 폴더 구조

```
Parts Viewer/
├── dist/                    # React 프로덕션 빌드 (HTML, CSS, JS)
├── dist-electron/           # Electron 메인 프로세스 (TypeScript 컴파일된 JS)
├── node_modules/            # 의존성 패키지
├── Parts Viewer.bat         # 실행 스크립트
└── package.json             # 프로젝트 설정
```

## 🗂️ 데이터 저장 위치

부품 정보는 다음 위치에 자동 저장됩니다:
```
C:\Users\[사용자명]\AppData\Roaming\parts-viewer\parts.db
```

## 🔧 개발 모드 (개발자용)

```bash
npm run electron-dev
```

## 📝 라이선스

Part of Parts Viewer Project - v0.1.0

---

**문제 발생 시:**
- 로그 파일 확인: `C:\Users\[사용자명]\AppData\Roaming\parts-viewer\parts-viewer.log`
- Node.js 설치 확인: `node --version`
