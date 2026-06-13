import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Explore() {
  const [profileImage, setProfileImage] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const img = await AsyncStorage.getItem("profileImage");
        setProfileImage(img);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false);

          setUnreadNotifications(count ?? 0);
        }
      };

      loadData();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top row: Search + Post + Notifications + Messages */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push("/search")}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={16} color="#666" style={{ marginRight: 6 }} />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/create-post")}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/messages")}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={19} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
    paddingHorizontal: 16,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },

  searchBar: {
    width: 200,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#222",
  },

  searchPlaceholder: {
    color: "#666",
    fontSize: 13,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ff3b30",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#000",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
