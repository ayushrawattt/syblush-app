import { Stack, usePathname } from "expo-router";
import { Platform } from "react-native";
import AppTabs from "../components/app-tabs.web";

export default function Layout() {
  const pathname = usePathname();
  
  const hideNav = ["/login", "/signup", "/", ""].includes(pathname);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {Platform.OS === "web" && !hideNav && <AppTabs />}
    </>
  );
}