import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => {
  return useContext(ThemeContext);
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Đọc theme từ localStorage hoặc system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    // Kiểm tra localStorage trước
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }
    // Fallback về system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  // Cập nhật DOM khi theme thay đổi hoặc component mount
  useEffect(() => {
    const root = document.documentElement;
    // Xóa cả hai classes trước
    root.classList.remove('light', 'dark');
    // Thêm class mới
    root.classList.add(theme);
    // Lưu vào localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Đảm bảo theme được áp dụng ngay khi component mount (fallback nếu script trong HTML chưa chạy)
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('light') && !root.classList.contains('dark')) {
      root.classList.add(theme);
    }
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

