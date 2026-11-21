import { createContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('themeName');
    if (saved) return saved;
  } catch (e) {
    // localStorage unavailable
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeName === 'dark');
  }, [themeName]);

  const toggleTheme = () => {
    const next = themeName === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('themeName', next);
    } catch (e) {
      // ignore
    }
    setThemeName(next);
  };

  return (
    <ThemeContext.Provider value={[{ themeName, toggleTheme }]}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeProvider, ThemeContext };