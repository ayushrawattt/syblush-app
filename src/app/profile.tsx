import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
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

const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

export default function Profile() {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = async () => {
    setProfileLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfileLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url, bio, is_verified")
      .eq("id", user.id)
      .single();

    if (data) {
      setName(data.full_name || "");
      setUsername(data.username || "");
      setBio(data.bio || "");
      if (data.avatar_url) {
        setProfileImage(data.avatar_url + "?t=" + Date.now());
      } else {
        setProfileImage(null);
      }
      setIsVerified(data.is_verified ?? false);
    }

    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id);

    setFollowersCount(followers ?? 0);
    setFollowingCount(following ?? 0);

    const { data: postsData } = await supabase
      .from("posts")
      .select("id, image_url, caption, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
    setPostsCount(postsData?.length ?? 0);
    setProfileLoading(false);
  };

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  const handleDeletePost = async (postId: string) => {
    setMenuPostId(null);
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      console.log("Delete error:", error.message);
      window.alert("Delete failed: " + error.message);
    } else {
      setPosts((prev: any) => prev.filter((p: any) => p.id !== postId));
      setPostsCount((prev) => Math.max(0, prev - 1));
      setSelectedPost(null);
    }
  };

  const renderGridItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
      onPress={() => setSelectedPost(item)}
    >
      <Image source={{ uri: item.image_url }} style={styles.gridImage} resizeMode="cover" />
    </TouchableOpacity>
  );

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderGridItem}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        columnWrapperStyle={{ gap: GRID_GAP }}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                onPress={() => router.push("/create-post")}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.topBarUsername}>
                <Text style={[styles.title, { color: colors.text }]}>@{username}</Text>
                {isVerified && <VerifiedBadge size={14} />}
              </View>

              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                onPress={() => router.push("/settings")}
              >
                <Ionicons name="menu-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileRow}>
              <TouchableOpacity onPress={() => setShowImage(true)}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.bigAvatar} />
                ) : (
                  <View style={[styles.bigAvatarPlaceholder, { backgroundColor: colors.card }]}>
                    <Ionicons name="person" size={28} color={colors.subtextAlt} />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{postsCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtextAlt }]}>Posts</Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => router.push("/follow-list?type=followers")}
                >
                  <Text style={[styles.statNumber, { color: colors.text }]}>{followersCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtextAlt }]}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => router.push("/follow-list?type=following")}
                >
                  <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtextAlt }]}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
              {bio ? <Text style={[styles.bio, { color: colors.subtext }]}>{bio}</Text> : null}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.card, borderColor: colors.borderAlt }]}
                onPress={() => router.push("/edit-profile")}
              >
                <Text style={[styles.editButtonText, { color: colors.text }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtextAlt }]}>No posts yet</Text>
          </View>
        }
      />

      <Modal visible={showImage} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowImage(false)}
        >
          <Image source={{ uri: profileImage || "" }} style={styles.modalImage} />
        </TouchableOpacity>
      </Modal>

      {/* Full post modal - jab grid image tap ho, saari posts scrollable */}
      <Modal visible={!!selectedPost} transparent={false} animationType="slide">
        <SafeAreaView style={[styles.fullPostContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.fullPostTopBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setSelectedPost(null)}
              style={[styles.iconBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.fullPostTitle, { color: colors.text }]}>Posts</Text>
            <View style={{ width: 32 }} />
          </View>

          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View style={[styles.postCard, { borderBottomColor: colors.border }]}>
                <View style={styles.postHeader}>
                  <View style={[styles.avatar, { backgroundColor: colors.card }]}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={16} color={colors.subtextAlt} />
                    )}
                  </View>

                  <View style={styles.headerTextCol}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                      <Text style={[styles.handle, { color: colors.subtext }]} numberOfLines={1}>@{username}</Text>
                      {isVerified && <VerifiedBadge size={13} />}
                    </View>
                    {item.caption ? (
                      <Text style={[styles.caption, { color: colors.text }]}>{item.caption}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => setMenuPostId(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.subtext} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.imageWrapper, { backgroundColor: colors.card, borderColor: colors.borderAlt }]}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.subtext} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="repeat-outline" size={18} color={colors.subtext} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="heart-outline" size={16} color={colors.subtext} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="share-outline" size={16} color={colors.subtext} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Delete menu */}
      <Modal visible={!!menuPostId} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuPostId(null)}
        >
          <View style={[styles.menuBox, { backgroundColor: colors.cardAlt }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => menuPostId && handleDeletePost(menuPostId)}
            >
              <Ionicons name="trash-outline" size={18} color="#ff3b30" />
              <Text style={styles.menuItemDeleteText}>Delete Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuCancel}
              onPress={() => setMenuPostId(null)}
            >
              <Text style={[styles.menuCancelText, { color: colors.subtext }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: { paddingTop: 8 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topBarUsername: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 24,
  },
  bigAvatar: { width: 72, height: 72, borderRadius: 36 },
  bigAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  bioSection: { paddingHorizontal: 16, marginBottom: 12 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  name: { fontSize: 13, fontWeight: "600" },
  bio: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  buttonRow: { paddingHorizontal: 16, marginBottom: 12 },
  editButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  editButtonText: { fontWeight: "600", fontSize: 13 },

  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },

  fullPostContainer: {
    flex: 1,
  },
  fullPostTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  fullPostTitle: {
    fontSize: 15,
    fontWeight: "600",
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
  headerTextCol: { flex: 1 },
  fullName: { fontWeight: "700", fontSize: 14, flexShrink: 1 },
  handle: { fontSize: 13, flexShrink: 1 },
  caption: { fontSize: 15, lineHeight: 20 },
  moreBtn: {
    padding: 4,
  },
  imageWrapper: {
    width: POST_IMAGE_WIDTH,
    height: POST_IMAGE_HEIGHT,
    marginLeft: IMAGE_LEFT_INSET,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  postImage: { width: "100%", height: "100%" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 26,
    marginTop: 10,
    marginLeft: IMAGE_LEFT_INSET,
  },
  actionItem: { padding: 2 },
  emptyContainer: { paddingTop: 40, alignItems: "center" },
  emptyText: { fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: 300, height: 300, borderRadius: 16 },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  menuBox: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemDeleteText: {
    color: "#ff3b30",
    fontSize: 15,
    fontWeight: "600",
  },
  menuCancel: {
    paddingVertical: 14,
    alignItems: "center",
  },
  menuCancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
});