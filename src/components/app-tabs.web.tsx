import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#000" : "none"} stroke={active ? "#000" : "#666"} strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#000" : "#666"} strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const CardIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#000" : "none"} stroke={active ? "#000" : "#666"} strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const PersonIcon = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#000" : "none"} stroke={active ? "#000" : "#666"} strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function AppTabs() {
  const pathname = usePathname();
  if (!pathname.match(/^\/(explore|search|membership|profile)$/)) return null;

  const tabs = [
    { name: "Home", href: "/explore", match: "/explore", Icon: HomeIcon },
    { name: "Search", href: "/search", match: "/search", Icon: SearchIcon },
    { name: "Membership", href: "/membership", match: "/membership", Icon: CardIcon },
    { name: "Profile", href: "/profile", match: "/profile", Icon: PersonIcon },
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
              <tab.Icon active={isActive} />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.name}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "fixed" as any,
    bottom: 16,
    left: 24,
    right: 24,
    backgroundColor: "rgba(12,12,12,0.97)",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    // @ts-ignore
    outlineStyle: "none",
    // @ts-ignore
    WebkitTapHighlightColor: "transparent",
  },
  navInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 56,
  },
  navInnerActive: { backgroundColor: "#ffffff" },
  navText: { color: "#666", fontSize: 10, fontWeight: "500", marginTop: 3 },
  navTextActive: { color: "#000", fontWeight: "700" },
});