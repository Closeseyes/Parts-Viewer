import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface Statistics {
  totalParts: number;
  priceStats: {
    min: number;
    max: number;
    avg: number;
  };
  vendorStats: Array<{ vendor: string; count: number }>;
  categoryStats: Array<{ id: string; name: string; color: string; count: number }>;
  recentPriceChanges: Array<{
    partname: string;
    price_before: number;
    price_after: number;
    changed_at: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await (window as any).electron.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('통계 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard">로딩 중...</div>;
  if (!stats) return <div className="dashboard">통계를 불러올 수 없습니다.</div>;

  return (
    <div className="dashboard">
      <h2>📊 대시보드</h2>

      {/* 주요 지표 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalParts}</div>
          <div className="stat-label">등록된 부품</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">₩ {stats.priceStats.avg?.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) || 0}</div>
          <div className="stat-label">평균 단가</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">₩ {stats.priceStats.min?.toLocaleString('ko-KR') || 0}</div>
          <div className="stat-label">최저 단가</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">₩ {stats.priceStats.max?.toLocaleString('ko-KR') || 0}</div>
          <div className="stat-label">최고 단가</div>
        </div>
      </div>

      {/* 공급업체별 분석 */}
      <div className="analysis-section">
        <h3>🏭 공급업체별 부품 수</h3>
        <div className="vendor-list">
          {stats.vendorStats && stats.vendorStats.length > 0 ? (
            stats.vendorStats.map((vendor, idx) => (
              <div key={idx} className="vendor-item">
                <div className="vendor-name">{vendor.vendor || '(미지정)'}</div>
                <div className="vendor-bar">
                  <div
                    className="vendor-progress"
                    style={{
                      width: `${(vendor.count / stats.totalParts) * 100}%`,
                    }}
                  />
                </div>
                <div className="vendor-count">{vendor.count}건</div>
              </div>
            ))
          ) : (
            <p className="no-data">데이터 없음</p>
          )}
        </div>
      </div>

      {/* 카테고리별 분석 */}
      <div className="analysis-section">
        <h3>🏷️ 카테고리별 부품 수</h3>
        <div className="category-grid">
          {stats.categoryStats && stats.categoryStats.length > 0 ? (
            stats.categoryStats.map((cat) => (
              <div key={cat.id} className="category-box" style={{ borderColor: cat.color }}>
                <div className="category-name">{cat.name || '(미분류)'}</div>
                <div className="category-count">{cat.count}건</div>
              </div>
            ))
          ) : (
            <p className="no-data">카테고리 없음</p>
          )}
        </div>
      </div>

      {/* 최근 가격 변동 */}
      <div className="analysis-section">
        <h3>📈 최근 가격 변동 (최근 10건)</h3>
        {stats.recentPriceChanges && stats.recentPriceChanges.length > 0 ? (
          <table className="recent-changes">
            <thead>
              <tr>
                <th>부품명</th>
                <th>변동 전</th>
                <th>변동 후</th>
                <th>변동률</th>
                <th>변동일시</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPriceChanges.map((change, idx) => {
                const changeRate = ((change.price_after - change.price_before) / change.price_before) * 100;
                return (
                  <tr key={idx}>
                    <td>{change.partname}</td>
                    <td>₩ {change.price_before.toLocaleString('ko-KR')}</td>
                    <td>₩ {change.price_after.toLocaleString('ko-KR')}</td>
                    <td className={changeRate >= 0 ? 'positive' : 'negative'}>
                      {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%
                    </td>
                    <td>{new Date(change.changed_at).toLocaleString('ko-KR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="no-data">최근 변동 없음</p>
        )}
      </div>

      <button onClick={loadStatistics} className="btn refresh">🔄 새로고침</button>
    </div>
  );
};
