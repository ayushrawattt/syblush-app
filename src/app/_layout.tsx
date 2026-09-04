import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import AppTabs from "../components/app-tabs.web";
import { ThemeProvider } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== "/" && pathname !== "") {
        router.replace("/");
      }
      setLoading(false);
    });
  }, []);

  const hideNav =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/" ||
    pathname === "" ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/messages");

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
      {Platform.OS === "web" && !hideNav && <AppTabs />}
    </ThemeProvider>
  );
}