import { useEffect, useState } from 'react'
import './App.css'
import { PartsList } from './components/PartsList'
import { AddPart } from './components/AddPart'
import { ImportParts } from './components/ImportParts'
import { Dashboard } from './components/Dashboard'
import { AdminLoginModal } from './components/AdminLoginModal'

type AppTab = 'dashboard' | 'parts' | 'import'

function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [admin, setAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard')

  useEffect(() => {
    const saved = localStorage.getItem('pv_admin')
    if (saved === '1') setAdmin(true)
  }, [])

  const handlePartAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleAdminLoginSuccess = () => {
    setAdmin(true)
    localStorage.setItem('pv_admin', '1')
    setShowAdminLogin(false)
    alert('관리자 모드가 활성화되었습니다.')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>📦 부품 관리 시스템</h1>
          <div className="admin-controls">
            <span className={"admin-badge " + (admin ? 'on' : 'off')}>관리자 {admin ? 'ON' : 'OFF'}</span>
            {admin ? (
              <button
                className="admin-btn off"
                onClick={() => { 
                  setAdmin(false); 
                  localStorage.setItem('pv_admin', '0');
                  alert('관리자 모드를 종료했습니다.');
                }}
              >관리자 종료</button>
            ) : (
              <button
                className="admin-btn"
                onClick={() => setShowAdminLogin(true)}
              >관리자 모드</button>
            )}
          </div>
        </div>
      </header>
      
      {/* 탭 네비게이션 */}
      <nav className="app-nav">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 대시보드
        </button>
        <button 
          className={`tab-btn ${activeTab === 'parts' ? 'active' : ''}`}
          onClick={() => setActiveTab('parts')}
        >
          📦 부품 목록
        </button>
        {admin && (
          <button 
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📥 대량 Import
          </button>
        )}
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard />}
        
        {activeTab === 'parts' && (
          <>
            {admin && <AddPart onPartAdded={handlePartAdded} />}
            <PartsList key={refreshKey} adminMode={admin} />
          </>
        )}
        
        {activeTab === 'import' && admin && <ImportParts onImported={() => setRefreshKey(prev => prev + 1)} />}
      </main>

      {/* 관리자 로그인 모달 */}
      <AdminLoginModal 
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  )
}

export default App
