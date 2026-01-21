# Changelog

## v0.1.0 - 2026-01-21
- Electron 런타임을 CommonJS로 전환 (`package.json` type 변경)
- `__dirname` 중복 선언 제거로 기동 에러 해결
- Preload에 `exportToExcel`, `getStatistics` IPC 노출
- 파트 리스트/추가 폼의 카테고리 드롭다운 제거 (요구사항 반영)
- 일괄 등록 시 기존 부품의 카테고리 유지 로직 보강
- 엑셀 내보내기 추가, 통계 조회 기능 추가
- 개발 모드에서 Vite → Electron 로드 안정화
