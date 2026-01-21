import React, { useState, useEffect } from 'react';
import './PartsList.css';

interface Part {
  id: string;
  partname: string;
  vendor: string;
  price: number;
  price_usd?: number;
  price_krw?: number;
  sap_code: string;
  category_name?: string;
  created_at: string;
}

interface PartsListProps {
  adminMode?: boolean;
}

export const PartsList: React.FC<PartsListProps> = ({ adminMode = false }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Part>>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [displayedParts, setDisplayedParts] = useState<Part[]>([]);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [sortByCategoryAsc, setSortByCategoryAsc] = useState(true);

  useEffect(() => {
    loadParts();
  }, []);

  // 부품 목록이 변경되면 displayedParts 업데이트
  useEffect(() => {
    applyFiltersAndSort(searchKeyword, sortByCategoryAsc);
  }, [parts, searchKeyword, sortByCategoryAsc]);

  const loadParts = async () => {
    try {
      console.log('loadParts 호출, window.electron:', (window as any).electron);
      if (!(window as any).electron) {
        throw new Error('window.electron이 undefined입니다!');
      }
      const data = await (window as any).electron.getParts();
      console.log('부품 데이터:', data);
      if (data && data.length > 0) {
        console.log('첫 번째 부품:', data[0]);
      }
      setParts(data);
    } catch (error) {
      console.error('부품 로드 오류:', error);
      alert(`에러: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = (keyword: string, asc: boolean) => {
    const trimmed = keyword.trim().toLowerCase();
    let next = [...parts];

    if (trimmed.length > 0) {
      next = next.filter((p) => {
        const target = `${p.partname} ${p.vendor} ${p.sap_code ?? ''} ${p.category_name ?? ''}`.toLowerCase();
        return target.includes(trimmed);
      });
    }

    next.sort((a, b) => {
      const ca = a.category_name || '';
      const cb = b.category_name || '';
      return asc ? ca.localeCompare(cb) || a.partname.localeCompare(b.partname) : cb.localeCompare(ca) || b.partname.localeCompare(a.partname);
    });

    setDisplayedParts(next);
  };

  const handleSearch = async () => {
    applyFiltersAndSort(searchKeyword, sortByCategoryAsc);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    applyFiltersAndSort('', sortByCategoryAsc);
  };

  const handleExportExcel = async () => {
    try {
      const result = await (window as any).electron.exportToExcel();
      alert(`✓ Excel 파일 저장 성공!\n부품 ${result.count}건이 내보내졌습니다.\n\n파일명: ${result.filePath.split('\\').pop()}\n위치: 다운로드 폴더`);
    } catch (error) {
      console.error('Export 오류:', error);
      alert('Excel 내보내기 중 오류가 발생했습니다.');
    }
  };

  const toggleSelectPart = (id: string) => {
    setSelectedParts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedParts(new Set(displayedParts.map(p => p.id)));
  };

  const clearSelection = () => {
    setSelectedParts(new Set());
  };

  const deleteSelected = async () => {
    if (!adminMode) return;
    if (selectedParts.size === 0) {
      alert('삭제할 부품을 선택해주세요.');
      return;
    }

    const count = selectedParts.size;
    if (!window.confirm(`선택한 ${count}개의 부품을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 선택된 모든 부품 삭제
      for (const id of selectedParts) {
        await (window as any).electron.deletePart(id);
      }
      clearSelection();
      await loadParts();
      alert(`${count}개의 부품이 삭제되었습니다.`);
    } catch (e) {
      console.error('부품 삭제 실패:', e);
      alert('부품 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminMode) return;
    if (window.confirm('이 부품을 삭제하시겠습니까?')) {
      await (window as any).electron.deletePart(id);
      loadParts();
    }
  };

  const startEdit = (part: Part) => {
    setEditingId(part.id);
    setEditForm({
      id: part.id,
      partname: part.partname,
      vendor: part.vendor,
      price: part.price,
      sap_code: part.sap_code,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const payload = {
        id: editingId,
        partname: editForm.partname ?? '',
        vendor: editForm.vendor ?? '',
        price: Number(editForm.price ?? 0),
        sap_code: editForm.sap_code ?? '',
      };
      await (window as any).electron.updatePart(payload);
      cancelEdit();
      await loadParts();
    } catch (e) {
      console.error('수정 저장 실패:', e);
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="parts-list">
      <h2>부품 목록 ({displayedParts.length})</h2>
      
      {/* 검색 영역 */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="부품명, 공급업체, SAP 코드로 검색..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="search-input"
        />
        <button onClick={handleSearch} className="btn search">검색</button>
        {searchKeyword && (
          <button onClick={handleClearSearch} className="btn clear">초기화</button>
        )}
        <button onClick={handleExportExcel} className="btn export" title="부품 목록을 Excel 파일로 내보내기">
          📥 Excel 다운로드
        </button>
      </div>

      {/* 선택 영역 */}
      <div className="selection-bar">
        <span className="selection-info">
          선택됨: {selectedParts.size}개 / 전체: {displayedParts.length}개
        </span>
        <button onClick={selectAll} className="btn" disabled={displayedParts.length === 0}>
          전체 선택
        </button>
        <button onClick={clearSelection} className="btn" disabled={selectedParts.size === 0}>
          선택 해제
        </button>
        {adminMode && (
          <button 
            onClick={deleteSelected} 
            className="btn delete" 
            disabled={selectedParts.size === 0}
            style={{ backgroundColor: selectedParts.size > 0 ? '#e74c3c' : '#ccc' }}
          >
            🗑️ 선택 삭제 ({selectedParts.size})
          </button>
        )}
      </div>

      {searchKeyword && (
        <div className="search-info">
          "{searchKeyword}" 검색 결과: {displayedParts.length}건
        </div>
      )}
      
      <table>
        <thead>
          <tr>
            <th style={{ width: '50px' }}>
              <input
                type="checkbox"
                checked={displayedParts.length > 0 && selectedParts.size === displayedParts.length}
                onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
              />
            </th>
            <th>부품명</th>
            <th>공급업체</th>
            <th>단가 (₩)</th>
            <th>단가 ($)</th>
            <th>SAP 코드</th>
            <th style={{ cursor: 'pointer' }} onClick={() => setSortByCategoryAsc((p) => !p)}>
              카테고리 {sortByCategoryAsc ? '▲' : '▼'}
            </th>
            <th>등록일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {displayedParts.map((part) => {
            const isEditing = editingId === part.id;
            const isSelected = selectedParts.has(part.id);
            return (
              <tr key={part.id} className={isSelected ? 'selected-row' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectPart(part.id)}
                  />
                </td>
                <td>
                  {isEditing ? (
                    <input
                      value={editForm.partname ?? ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, partname: e.target.value }))}
                    />
                  ) : (
                    part.partname
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      value={editForm.vendor ?? ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, vendor: e.target.value }))}
                    />
                  ) : (
                    part.vendor
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={String(editForm.price ?? 0)}
                      onChange={(e) => setEditForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    />
                  ) : (
                    <>{part.price_krw ? `₩${part.price_krw.toLocaleString()}` : '-'}</>
                  )}
                </td>
                <td>
                  {part.price_usd ? `$${part.price_usd.toLocaleString()}` : '-'}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      value={editForm.sap_code ?? ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, sap_code: e.target.value }))}
                    />
                  ) : (
                    part.sap_code || '-'
                  )}
                </td>
                <td>{part.category_name || '-'}</td>
                <td>{new Date(part.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="actions">
                  {adminMode ? (
                    isEditing ? (
                      <>
                        <button className="btn save" onClick={saveEdit}>저장</button>
                        <button className="btn cancel" onClick={cancelEdit}>취소</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={async () => {
                          try {
                            const rows = await (window as any).electron.getHistory(part.id)
                            alert(`이력 ${Array.isArray(rows) ? rows.length : 0}건`)
                          } catch (e) {
                            alert('이력을 불러오지 못했습니다.')
                          }
                        }}>이력</button>
                        <button className="btn edit" onClick={() => startEdit(part)}>수정</button>
                        <button className="btn delete" onClick={() => handleDelete(part.id)}>삭제</button>
                      </>
                    )
                  ) : (
                    <span className="muted">읽기 전용</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
