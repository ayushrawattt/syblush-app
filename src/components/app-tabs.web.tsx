import { router, usePathname } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#fff" : "none"} stroke={active ? "#fff" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const MembershipIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#fff" : "none"} stroke={active ? "#fff" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#fff" : "none"} stroke={active ? "#fff" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function AppTabs() {
  const pathname = usePathname();
  if (!pathname.match(/^\/(explore|search|membership|profile)$/)) return null;

  const tabs = [
    { name: "Home", href: "/explore", match: "/explore", Icon: HomeIcon },
    { name: "Membership", href: "/membership", match: "/membership", Icon: MembershipIcon },
    { name: "Profile", href: "/profile", match: "/profile", Icon: ProfileIcon },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.match;
        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.7}
            style={styles.navItem}
            onPress={() => router.push(tab.href as any)}
          >
            <tab.Icon active={isActive} />
            <View style={[styles.dot, isActive && styles.dotActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "fixed" as any,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    borderTopWidth: 0.5,
    borderTopColor: "#222",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
    // @ts-ignore
    outlineStyle: "none",
    // @ts-ignore
    WebkitTapHighlightColor: "transparent",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  dotActive: {
    backgroundColor: "#fff",
  },
});