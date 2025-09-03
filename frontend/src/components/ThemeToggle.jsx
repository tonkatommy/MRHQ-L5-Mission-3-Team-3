import { useEffect, useState } from "react";

function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    const root = document.documentElement; // <html>
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Keep in sync with OS setting if user hasn't forced a choice
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const saved = localStorage.getItem("theme");
      if (!saved) setTheme(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      aria-label="Toggle dark mode"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
    >
      <span className="theme-icon">{theme === "dark" ? "🌙" : "☀️"}</span>
    </button>
  );
}
