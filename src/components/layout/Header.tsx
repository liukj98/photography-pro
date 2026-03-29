import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Camera, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { label: '首页', href: '/', public: true },
    { label: '探索', href: '/explore', public: true },
    ...(isAuthenticated
      ? [
          { label: '上传', href: '/upload', public: false },
          { label: '我的作品', href: '/manage', public: false },
          { label: '收藏', href: '/favorites', public: false },
        ]
      : []),
  ];

  // 检查链接是否激活
  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-text-primary hidden sm:block">
              PhotoPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-xl transition-all',
                  isActive(item.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={`/u/${user?.username}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all',
                    location.pathname === `/u/${user?.username}`
                      ? 'text-primary bg-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  )}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span>{user?.username}</span>
                </Link>
                <Link 
                  to="/settings"
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-xl transition-all',
                    isActive('/settings')
                      ? 'text-primary bg-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  )}
                >
                  设置
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-surface transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-text-primary" />
            ) : (
              <Menu className="w-6 h-6 text-text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="py-4 space-y-2 border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'block px-4 py-2 text-sm font-medium rounded-xl transition-all',
                  isActive(item.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <>
                <Link
                  to={`/u/${user?.username}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all',
                    location.pathname === `/u/${user?.username}`
                      ? 'text-primary bg-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {user?.username}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-xl transition-all text-left"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-4 pt-2">
                <Link to="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">登录</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">注册</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
