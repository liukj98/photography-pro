import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type Theme } from '../../stores/themeStore';
import { cn } from '../../lib/utils';

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentTheme = themes.find((t) => t.value === theme) ?? themes[2];
  const CurrentIcon = currentTheme.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
        title="切换主题"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-surface rounded-xl border border-border shadow-lg overflow-hidden z-50 animate-fade-in">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left',
                theme === value
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {theme === value && (
                <span className="ml-auto text-xs text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
