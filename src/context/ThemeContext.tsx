import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const darkColors = {
  mode: "dark" as ThemeMode,
  background: "#000",
  card: "#0d0d0d",
  cardAlt: "#111",
  border: "#1e1e1e",
  borderAlt: "#222",
  text: "#fff",
  subtext: "#888",
  subtextAlt: "#666",
  iconBg: "#0d0d0d",
};

const lightColors = {
  mode: "light" as ThemeMode,
  background: "#fff",
  card: "#f5f5f5",
  cardAlt: "#eee",
  border: "#e0e0e0",
  borderAlt: "#ddd",
  text: "#000",
  subtext: "#555",
  subtextAlt: "#777",
  iconBg: "#f0f0f0",
};

const ThemeContext = createContext({
  colors: darkColors,
  mode: "dark" as ThemeMode,
  toggleTheme: () => {},
  setThemeMode: (mode: ThemeMode) => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("themeMode");
      if (saved === "light" || saved === "dark") {
        setMode(saved);
      }
    })();
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem("themeMode", newMode);
  };

  const toggleTheme = () => {
    setThemeMode(mode === "dark" ? "light" : "dark");
  };

  const colors = mode === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, mode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);