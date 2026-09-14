"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export const themeBootScript = `
(function(){try{
  var t = localStorage.getItem("foryxo_theme") || "system";
  var d = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", d);
}catch(e){}})();
`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("foryxo_theme") as Theme) || "system";
    // The boot script applies the visual theme before hydration; this only syncs the control state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(saved);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if ((localStorage.getItem("foryxo_theme") || "system") === "system") {
        document.documentElement.classList.toggle("dark", media.matches);
      }
    };
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("foryxo_theme", t);
    const dark =
      t === "dark" ||
      (t === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const label =
    theme === "light" ? "Dark" : theme === "dark" ? "System" : "Light";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="rounded-lg p-2 text-sm hover:bg-subtle"
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      title={label}
    >
      {theme === "dark" ? "☀️" : theme === "light" ? "🌙" : "🖥️"}
    </button>
  );
}
