import React, { useState, useEffect } from 'react';
import './Categories.css';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export const Categories: React.FC<{ adminMode: boolean }> = ({ adminMode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3498db');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await (window as any).electron.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      await (window as any).electron.addCategory({
        name: newCategoryName,
        description: newCategoryDesc,
        color: newCategoryColor,
      });
      alert('카테고리가 추가되었습니다.');
      setNewCategoryName('');
      setNewCategoryDesc('');
      setNewCategoryColor('#3498db');
      await loadCategories();
    } catch (error: any) {
      alert(`오류: ${error.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('이 카테고리를 삭제하시겠습니까?')) {
      try {
        await (window as any).electron.deleteCategory(categoryId);
        alert('카테고리가 삭제되었습니다.');
        await loadCategories();
      } catch (error) {
        console.error('삭제 오류:', error);
        alert('카테고리 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) return <div className="categories">로딩 중...</div>;

  return (
    <div className="categories">
      <h2>🏷️ 카테고리 관리</h2>

      {adminMode && (
        <div className="add-category-form">
          <h3>새 카테고리 추가</h3>
          <div className="form-group">
            <label>카테고리 이름 *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="예: 저항, 캐패시터, MCU 등"
            />
          </div>

          <div className="form-group">
            <label>설명</label>
            <input
              type="text"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              placeholder="카테고리 설명 (선택사항)"
            />
          </div>

          <div className="form-group">
            <label>색상</label>
            <div className="color-picker">
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
              />
              <span className="color-preview" style={{ backgroundColor: newCategoryColor }} />
            </div>
          </div>

          <button onClick={handleAddCategory} className="btn add">
            ➕ 추가
          </button>
        </div>
      )}

      <div className="category-list">
        <h3>카테고리 목록 ({categories.length})</h3>
        {categories.length === 0 ? (
          <p className="no-data">등록된 카테고리가 없습니다.</p>
        ) : (
          <div className="category-grid">
            {categories.map((cat) => (
              <div key={cat.id} className="category-card" style={{ borderLeftColor: cat.color }}>
                <div className="cat-header">
                  <div className="cat-color" style={{ backgroundColor: cat.color }} />
                  <div className="cat-info">
                    <h4>{cat.name}</h4>
                    <p>{cat.description || '-'}</p>
                  </div>
                </div>
                {adminMode && (
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="btn delete-cat"
                  >
                    🗑️ 삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
