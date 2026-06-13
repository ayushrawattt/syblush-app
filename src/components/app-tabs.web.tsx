import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AppTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Home",
      href: "/explore",
      match: "/explore",
      icon: "home-outline" as const,
      iconActive: "home" as const,
    },
    {
      name: "Membership",
      href: "/membership",
      match: "/membership",
      icon: "card-outline" as const,
      iconActive: "card" as const,
    },
    {
      name: "Profile",
      href: "/profile",
      match: "/profile",
      icon: "person-outline" as const,
      iconActive: "person" as const,
    },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.match;
        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.6}
            style={styles.navItem}
            onPress={() => router.push(tab.href as any)}
          >
            <View style={[styles.navInner, isActive && styles.navInnerActive]}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? "#000" : "#888"}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {tab.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: "rgba(20,20,20,0.95)",
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#262626",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    // @ts-ignore - web only
    outlineStyle: "none",
    // @ts-ignore - web only
    WebkitTapHighlightColor: "transparent",
  },
  navInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 64,
  },
  navInnerActive: {
    backgroundColor: "#ffffff",
  },
  navText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
  navTextActive: {
    color: "#000",
    fontWeight: "700",
  },
});
