import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Explore() {
  const [profileImage, setProfileImage] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const img = await AsyncStorage.getItem("profileImage");
        setProfileImage(img);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Notifications count
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false);
          setUnreadNotifications(count ?? 0);

          // ✅ Posts fetch - profiles join hataya
          const { data: postsData, error } = await supabase
            .from("posts")
            .select("id, image_url, caption, created_at, user_id")
            .order("created_at", { ascending: false });

          if (error) {
            console.log("Posts fetch error:", error.message);
          } else {
            // ✅ Har post ke liye profile alag fetch karo
            const postsWithProfiles = await Promise.all(
              (postsData || []).map(async (post) => {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("username, avatar_url")
                  .eq("id", post.user_id)
                  .single();
                return { ...post, profiles: profile };
              })
            );
            setPosts(postsWithProfiles);
          }
        }

        setLoading(false);
      };

      loadData();
    }, []),
  );

  const renderPost = ({ item }: any) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={18} color="#888" />
          )}
        </View>
        <Text style={styles.username}>
          {item.profiles?.username || "User"}
        </Text>
      </View>

      <Image source={{ uri: item.image_url }} style={styles.postImage} />

      {item.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.username}>{item.profiles?.username || "User"} </Text>
          {item.caption}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
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
  postCard: {
    marginBottom: 24,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  username: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  postImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#111",
  },
  caption: {
    color: "#ccc",
    fontSize: 13,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#555",
    fontSize: 16,
  },
});