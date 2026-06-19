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
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const img = await AsyncStorage.getItem("profileImage");
        setProfileImage(img);

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false);
          setUnreadNotifications(count ?? 0);

          // ✅ following list fetch karo (Following tab ke liye)
          const { data: followsData } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id);
          setFollowingIds((followsData || []).map((f) => f.following_id));

          const { data: postsData, error } = await supabase
            .from("posts")
            .select("id, image_url, caption, created_at, user_id")
            .order("created_at", { ascending: false });

          if (error) {
            console.log("Posts fetch error:", error.message);
          } else {
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

  const visiblePosts =
    activeTab === "following"
      ? posts.filter((p: any) => followingIds.includes(p.user_id))
      : posts;

  const renderPost = ({ item }: any) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={16} color="#666" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{item.profiles?.username || "User"}</Text>
        </View>
      </View>

      {item.caption ? (
        <Text style={styles.caption}>{item.caption}</Text>
      ) : null}

      <Image source={{ uri: item.image_url }} style={styles.postImage} />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={17} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="repeat-outline" size={19} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="heart-outline" size={17} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="share-outline" size={17} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/create-post")}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={16} color="#fff" />
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
          <Ionicons name="chatbubble-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ✅ For you / Following tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("forYou")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "forYou" && styles.tabTextActive]}>
            For you
          </Text>
          {activeTab === "forYou" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("following")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "following" && styles.tabTextActive]}>
            Following
          </Text>
          {activeTab === "following" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : visiblePosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === "following" ? "Follow people to see their posts" : "No posts yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visiblePosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "#1e1e1e",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ff3b30",
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: "#000",
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabIndicator: {
    marginTop: 8,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  postCard: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a1a",
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
    fontWeight: "700",
    fontSize: 14,
  },
  caption: {
    color: "#eee",
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#0d0d0d",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 28,
    marginTop: 12,
  },
  actionItem: {
    padding: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#444",
    fontSize: 13,
  },
});