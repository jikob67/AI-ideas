import React, { useState, useEffect, useRef } from 'react';
import { 
  Bars3Icon, 
  SunIcon, 
  MoonIcon, 
  ArrowLeftOnRectangleIcon
} from './Icons';
import { useAuth } from '../hooks/useAuth';
import { View } from '../types';

interface HeaderProps {
  toggleSidebar: () => void;
  navigate?: (view: View, context?: any) => void;
  activeView?: View;
  navigationContext?: any;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, navigate, activeView, navigationContext }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const getAvatarUrl = (user: any) => {
      if (user?.profilePictureUrl) return user.profilePictureUrl;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=128`;
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('theme-inverted');
        setIsDarkMode(false);
    } else {
        document.body.classList.remove('theme-inverted');
        setIsDarkMode(true);
    }
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle('theme-inverted');
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    localStorage.setItem('app-theme', newIsDarkMode ? 'dark' : 'light');
  };

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800" id="app-main-header">
      <div className="container mx-auto flex items-center justify-between p-4" id="header-container">
        <div className="flex items-center gap-3">
           <button
            onClick={toggleSidebar}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
            id="toggle-sidebar-btn"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Toggle theme"
            title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            id="theme-toggler-btn"
          >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
          
          {currentUser && (
            <div className="relative" ref={menuRef} id="user-avatar-menu">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2" id="avatar-trigger">
                <img 
                  src={getAvatarUrl(currentUser)} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover border border-slate-600" 
                />
              </button>
              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 animate-fade-in-up" id="user-popup-menu">
                  <div className="px-4 py-2 border-b border-slate-700">
                    <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-right flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                    id="logout-action-btn"
                  >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
