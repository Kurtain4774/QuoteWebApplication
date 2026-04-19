import { createContext, useContext, useState, useLayoutEffect } from "react";

const ThemeContext = createContext(null);

const FONT_SIZE_MAP = {
  small: "13px",
  medium: "15px",
  large: "18px",
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [customBg, setCustomBgState] = useState(
    () => localStorage.getItem("customBg") || "#ffffff",
  );
  const [customText, setCustomTextState] = useState(
    () => localStorage.getItem("customText") || "#111827",
  );
  const [fontSize, setFontSizeState] = useState(
    () => localStorage.getItem("fontSize") || "medium",
  );

  // useLayoutEffect runs before paint, so CSS class changes are invisible to the user.
  // index.html already applies the initial class from localStorage before React boots,
  // so this effect only fires on subsequent in-session changes.
  useLayoutEffect(() => {
    const body = document.body;
    body.classList.remove("theme-light", "theme-dark", "theme-custom");
    body.classList.add(`theme-${theme}`);
    body.style.setProperty("--custom-bg", customBg);
    body.style.setProperty("--custom-text", customText);
    document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize] || "15px";
  }, [theme, customBg, customText, fontSize]);

  function setTheme(t) {
    setThemeState(t);
    localStorage.setItem("theme", t);
  }

  function setCustomBg(c) {
    setCustomBgState(c);
    localStorage.setItem("customBg", c);
  }

  function setCustomText(c) {
    setCustomTextState(c);
    localStorage.setItem("customText", c);
  }

  function setFontSize(s) {
    setFontSizeState(s);
    localStorage.setItem("fontSize", s);
  }

  // Called on logout — wipes theme back to light and clears localStorage keys.
  function resetTheme() {
    setThemeState("light");
    setCustomBgState("#ffffff");
    setCustomTextState("#111827");
    setFontSizeState("medium");
    localStorage.removeItem("theme");
    localStorage.removeItem("customBg");
    localStorage.removeItem("customText");
    localStorage.removeItem("fontSize");
  }

  // Called after login / session restore — applies the user's saved DB preferences.
  // Uses `'key' in prefs` so a value of 'light' or '#ffffff' still gets applied
  // (truthy checks would silently skip valid default values).
  function applyPreferences(prefs) {
    console.log("Applying preferences:", prefs);
    if (!prefs || typeof prefs !== "object") return;
    if ("theme" in prefs) {
      setThemeState(prefs.theme);
      localStorage.setItem("theme", prefs.theme);
    }
    if ("customBg" in prefs) {
      setCustomBgState(prefs.customBg);
      localStorage.setItem("customBg", prefs.customBg);
    }
    if ("customText" in prefs) {
      setCustomTextState(prefs.customText);
      localStorage.setItem("customText", prefs.customText);
    }
    if ("fontSize" in prefs) {
      setFontSizeState(prefs.fontSize);
      localStorage.setItem("fontSize", prefs.fontSize);
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        customBg,
        setCustomBg,
        customText,
        setCustomText,
        fontSize,
        setFontSize,
        resetTheme,
        applyPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
