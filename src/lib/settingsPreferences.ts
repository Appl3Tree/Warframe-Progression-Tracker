export const THEME_KEY = "wft_theme_v1";
export type AppTheme = "dark" | "light";

export function getStoredTheme(): AppTheme {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("theme-light");
    root.classList.remove("theme-dark");
  } else {
    root.classList.add("theme-dark");
    root.classList.remove("theme-light");
  }
  localStorage.setItem(THEME_KEY, theme);
}

export const COMPACT_KEY = "wft_compact_lists_v1";

export function getCompactRows(): boolean {
  return localStorage.getItem(COMPACT_KEY) === "1";
}

export function setCompactRows(v: boolean) {
  localStorage.setItem(COMPACT_KEY, v ? "1" : "0");
  document.documentElement.setAttribute("data-compact", v ? "1" : "0");
}

export const TZ_KEY = "wft_timezone_v1";

export function getStoredTimezone(): string {
  return localStorage.getItem(TZ_KEY) || "UTC";
}

export function setStoredTimezone(tz: string) {
  localStorage.setItem(TZ_KEY, tz);
}
