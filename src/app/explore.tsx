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
                  .select("full_name, username, avatar_url")
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

        <View style={styles.headerTextCol}>
          <View style={styles.nameRow}>
            <Text style={styles.fullName} numberOfLines={1}>
              {item.profiles?.full_name || item.profiles?.username || "User"}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              @{item.profiles?.username || "user"}
            </Text>
          </View>

          {item.caption ? (
            <Text style={styles.caption}>{item.caption}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="repeat-outline" size={18} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="heart-outline" size={16} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="share-outline" size={16} color="#888" />
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
    marginBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
  },
  tabText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  tabIndicator: {
    marginTop: 6,
    width: 26,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  postCard: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  headerTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  fullName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 1,
  },
  handle: {
    color: "#777",
    fontSize: 13,
    flexShrink: 1,
  },
  caption: {
    color: "#eee",
    fontSize: 15,
    lineHeight: 20,
  },
  imageWrapper: {
    width: "100%",
    maxHeight: 320,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0d0d0d",
  },
  postImage: {
    width: "100%",
    height: 260,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 26,
    marginTop: 10,
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