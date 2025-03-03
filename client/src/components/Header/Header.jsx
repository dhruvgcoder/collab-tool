import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

const Header = ({ onSave, onLoad, onNew, onExport }) => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    login(loginData.email, loginData.password);
    setShowLoginModal(false);
  };

  const handleExport = (format) => {
    onExport(format);
    setShowMenu(false);
  };

  return (
    <header className="app-header">
      <div className="logo">
        <h1>DrawCollab</h1>
      </div>
      
      <div className="header-actions">
        <button className="menu-button" onClick={toggleMenu}>
          ☰ Menu
        </button>
        
        {showMenu && (
          <div className="dropdown-menu">
            <button onClick={onNew}>New Drawing</button>
            <button onClick={onSave}>Save</button>
            <button onClick={onLoad}>Load</button>
            <div className="dropdown-submenu">
              <button>Export</button>
              <div className="dropdown-submenu-content">
                <button onClick={() => handleExport('png')}>PNG</button>
                <button onClick={() => handleExport('svg')}>SVG</button>
                <button onClick={() => handleExport('json')}>JSON</button>
              </div>
            </div>
            <div className="menu-divider"></div>
            {isAuthenticated ? (
              <>
                <div className="user-info">
                  <span>Signed in as</span>
                  <strong>{user?.email}</strong>
                </div>
                <button onClick={logout}>Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowLoginModal(true)}>Sign In</button>
                <button onClick={() => setShowLoginModal(true)}>Sign Up</button>
              </>
            )}
          </div>
        )}
        
        {isAuthenticated ? (
          <button className="user-button" onClick={logout}>
            {user?.email.charAt(0).toUpperCase()}
          </button>
        ) : (
          <button className="login-button" onClick={() => setShowLoginModal(true)}>
            Sign In
          </button>
        )}
      </div>
      
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="login-modal">
            <button className="close-modal" onClick={() => setShowLoginModal(false)}>×</button>
            <h2>Sign In</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="submit-button">Sign In</button>
            </form>
            <div className="modal-footer">
              <p>Don't have an account? <button onClick={() => {}}>Sign Up</button></p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;