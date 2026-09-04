import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import VerifiedBadge from "../components/verified-badge";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_PADDING = 14;
const AVATAR_SIZE = 34;
const HEADER_GAP = 10;
const IMAGE_LEFT_INSET = AVATAR_SIZE + HEADER_GAP;
const POST_IMAGE_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2 - IMAGE_LEFT_INSET;
const POST_IMAGE_HEIGHT = Math.min(POST_IMAGE_WIDTH, 300);

export default function Explore() {
  const { colors } = useTheme();
  const [profileImage, setProfileImage] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const img = await AsyncStorage.getItem("profileImage");
        setProfileImage(img);

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);

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
            const postsWithExtras = await Promise.all(
              (postsData || []).map(async (post) => {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("full_name, username, avatar_url, is_verified")
                  .eq("id", post.user_id)
                  .single();

                const { count: likeCount } = await supabase
                  .from("likes")
                  .select("*", { count: "exact", head: true })
                  .eq("post_id", post.id);

                const { data: myLike } = await supabase
                  .from("likes")
                  .select("id")
                  .eq("post_id", post.id)
                  .eq("user_id", user.id)
                  .maybeSingle();

                const { count: repostCount } = await supabase
                  .from("reposts")
                  .select("*", { count: "exact", head: true })
                  .eq("post_id", post.id);

                const { data: myRepost } = await supabase
                  .from("reposts")
                  .select("id")
                  .eq("post_id", post.id)
                  .eq("user_id", user.id)
                  .maybeSingle();

                return {
                  ...post,
                  profiles: profile,
                  likeCount: likeCount ?? 0,
                  likedByMe: !!myLike,
                  repostCount: repostCount ?? 0,
                  repostedByMe: !!myRepost,
                };
              })
            );
            setPosts(postsWithExtras);
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

  const toggleLike = async (postId: string) => {
    if (!currentUserId) return;
    const target = posts.find((p: any) => p.id === postId) as any;
    if (!target) return;
    const wasLiked = target.likedByMe;
    setPosts((prev: any) =>
      prev.map((p: any) =>
        p.id === postId
          ? { ...p, likedByMe: !wasLiked, likeCount: wasLiked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      )
    );
    if (wasLiked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: currentUserId });
    }
  };

  const toggleRepost = async (postId: string) => {
    if (!currentUserId) return;
    const target = posts.find((p: any) => p.id === postId) as any;
    if (!target) return;
    const wasReposted = target.repostedByMe;
    setPosts((prev: any) =>
      prev.map((p: any) =>
        p.id === postId
          ? { ...p, repostedByMe: !wasReposted, repostCount: wasReposted ? p.repostCount - 1 : p.repostCount + 1 }
          : p
      )
    );
    if (wasReposted) {
      await supabase.from("reposts").delete().eq("post_id", postId).eq("user_id", currentUserId);
    } else {
      await supabase.from("reposts").insert({ post_id: postId, user_id: currentUserId, original_user_id: target.user_id });
    }
  };

  const renderPost = ({ item }: any) => (
    <View style={[styles.postCard, { borderBottomColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.cardAlt }]}>
          {item.profiles?.avatar_url ? (
            <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={16} color={colors.subtextAlt} />
          )}
        </View>

        <View style={styles.headerTextCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>
              {item.profiles?.full_name || item.profiles?.username || "User"}
            </Text>
            <Text style={[styles.handle, { color: colors.subtext }]} numberOfLines={1}>
              @{item.profiles?.username || "user"}
            </Text>
            {item.profiles?.is_verified && <VerifiedBadge size={13} />}
          </View>

          {item.caption ? (
            <Text style={[styles.caption, { color: colors.text }]}>{item.caption}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.imageWrapper, { backgroundColor: colors.card, borderColor: colors.borderAlt }]}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push(`/post/${item.id}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.subtext} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionItem, styles.likeItem]}
          onPress={() => toggleRepost(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="repeat-outline"
            size={18}
            color={item.repostedByMe ? "#00c853" : colors.subtext}
          />
          {item.repostCount > 0 && (
            <Text style={[styles.likeCount, { color: colors.subtext }, item.repostedByMe && styles.repostCountActive]}>
              {item.repostCount}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionItem, styles.likeItem]}
          onPress={() => toggleLike(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.likedByMe ? "heart" : "heart-outline"}
            size={16}
            color={item.likedByMe ? "#ff3b5c" : colors.subtext}
          />
          {item.likeCount > 0 && (
            <Text style={[styles.likeCount, { color: colors.subtext }, item.likedByMe && styles.likeCountActive]}>
              {item.likeCount}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="share-outline" size={16} color={colors.subtext} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.iconBg, borderColor: colors.border }]}
          onPress={() => router.push("/create-post")}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.iconBg, borderColor: colors.border }]}
          onPress={() => router.push("/search")}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={14} color={colors.subtext} />
          <Text style={[styles.searchBarText, { color: colors.subtext }]}>Search </Text>
        </TouchableOpacity>

        <View style={styles.topRowRight}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.iconBg, borderColor: colors.border }]}
            onPress={() => router.push("/notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={16} color={colors.text} />
            {unreadNotifications > 0 && (
              <View style={[styles.badge, { borderColor: colors.background }]}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.iconBg, borderColor: colors.border }]}
            onPress={() => router.push("/messages")}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("forYou")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: colors.subtext }, activeTab === "forYou" && { color: colors.text, fontWeight: "600" }]}>
            For you
          </Text>
          {activeTab === "forYou" && <View style={[styles.tabIndicator, { backgroundColor: colors.text }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("following")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: colors.subtext }, activeTab === "following" && { color: colors.text, fontWeight: "600" }]}>
            Following
          </Text>
          {activeTab === "following" && <View style={[styles.tabIndicator, { backgroundColor: colors.text }]} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.text} style={{ marginTop: 40 }} />
      ) : visiblePosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.subtextAlt }]}>
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
    paddingTop: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 14,
    gap: 8,
  },
  topRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
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
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBarText: {
    fontSize: 13,
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tabIndicator: {
    marginTop: 6,
    width: 26,
    height: 2,
    borderRadius: 2,
  },
  postCard: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: HEADER_GAP,
    marginBottom: 10,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 1,
  },
  handle: {
    fontSize: 13,
    flexShrink: 1,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
  },
  imageWrapper: {
    width: POST_IMAGE_WIDTH,
    height: POST_IMAGE_HEIGHT,
    marginLeft: IMAGE_LEFT_INSET,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 26,
    marginTop: 10,
    marginLeft: IMAGE_LEFT_INSET,
  },
  actionItem: {
    padding: 2,
  },
  likeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  likeCountActive: {
    color: "#ff3b5c",
  },
  repostCountActive: {
    color: "#00c853",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});