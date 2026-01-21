import React, { useState, useEffect, useRef } from 'react';
import './AdminLoginModal.css';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setLoading(false);
      // 약간의 지연 후 포커스 설정
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    // 시뮬레이션 (실제는 백엔드와 통신)
    setTimeout(() => {
      if (password === '1234') {
        setPassword('');
        setLoading(false);
        onSuccess();
      } else {
        setError('비밀번호가 올바르지 않습니다.');
        setLoading(false);
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="admin-login-backdrop" onClick={handleClose}>
      <div className="admin-login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <h2>🔐 관리자 모드</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="login-content">
          <p className="login-description">관리자 비밀번호를 입력하세요</p>

          <div className="form-group">
            <input
              ref={inputRef}
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="password-input"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="login-actions">
            <button
              className="btn btn-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              취소
            </button>
            <button
              className="btn btn-login"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? '확인 중...' : '확인'}
            </button>
          </div>

          <div className="login-hint">
            💡 기본 비밀번호: 1234
          </div>
        </div>
      </div>
    </div>
  );
};
