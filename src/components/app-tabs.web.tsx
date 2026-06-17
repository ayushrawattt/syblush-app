import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#000" : "none"} stroke={active ? "#000" : "#888"} strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const CardIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#000" : "none"} stroke={active ? "#000" : "#888"} strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const PersonIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#000" : "none"} stroke={active ? "#000" : "#888"} strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function AppTabs() {
  const pathname = usePathname();
  if (!pathname.match(/^\/(explore|membership|profile)$/)) return null;
  const tabs = [
    { name: "Home", href: "/explore", match: "/explore", Icon: HomeIcon },
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
    // @ts-ignore
    outlineStyle: "none",
    // @ts-ignore
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
  navInnerActive: { backgroundColor: "#ffffff" },
  navText: { color: "#888", fontSize: 11, fontWeight: "500", marginTop: 4 },
  navTextActive: { color: "#000", fontWeight: "700" },
});