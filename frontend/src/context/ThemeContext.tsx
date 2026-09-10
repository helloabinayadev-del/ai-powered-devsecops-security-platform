import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";

interface ThemeContextType {
  theme: "light" | "dark" | "contrast";
  setTheme: (theme: "light" | "dark" | "contrast") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<"light" | "dark" | "contrast">(() => {
    const savedTheme = localStorage.getItem("theme") || localStorage.getItem("theme_mode");
    return savedTheme === "light" || savedTheme === "contrast" ? savedTheme : "dark";
  });

  const applyTheme = (nextTheme: "light" | "dark" | "contrast") => {
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    localStorage.setItem("theme_mode", nextTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setThemeState(nextTheme);
  };

  const setTheme = (nextTheme: "light" | "dark" | "contrast") => {
    setThemeState(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
