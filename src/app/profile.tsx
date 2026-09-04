import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
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
import { supabase } from "../lib/supabase";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_PADDING = 14;
const AVATAR_SIZE = 34;
const HEADER_GAP = 10;
const IMAGE_LEFT_INSET = AVATAR_SIZE + HEADER_GAP;
const POST_IMAGE_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2 - IMAGE_LEFT_INSET;
const POST_IMAGE_HEIGHT = Math.min(POST_IMAGE_WIDTH, 300);

export default function Profile() {
  const [name, setName] = useState("Ayush Rawat");
  const [username, setUsername] = useState("ayush");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url, bio, is_verified")
      .eq("id", user.id)
      .single();

    if (data) {
      if (data.full_name) setName(data.full_name);
      if (data.username) setUsername(data.username);
      if (data.bio) setBio(data.bio);
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
    }
  };

  const renderPost = ({ item }: any) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={16} color="#666" />
          )}
        </View>

        <View style={styles.headerTextCol}>
          <View style={styles.nameRow}>
            <Text style={styles.fullName} numberOfLines={1}>{name}</Text>
            {/* Post mein username ke baad tick */}
            <Text style={styles.handle} numberOfLines={1}>@{username}</Text>
            {isVerified && <VerifiedBadge size={13} />}
          </View>
          {item.caption ? (
            <Text style={styles.caption}>{item.caption}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setMenuPostId(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#888" />
        </TouchableOpacity>
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push("/create-post")}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Top bar mein @username + tick */}
              <View style={styles.topBarUsername}>
                <Text style={styles.title}>@{username}</Text>
                {isVerified && <VerifiedBadge size={14} />}
              </View>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push("/settings")}
              >
                <Ionicons name="menu-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileRow}>
              <TouchableOpacity onPress={() => setShowImage(true)}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.bigAvatar} />
                ) : (
                  <View style={styles.bigAvatarPlaceholder}>
                    <Ionicons name="person" size={28} color="#555" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{postsCount}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => router.push("/follow-list?type=followers")}
                >
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => router.push("/follow-list?type=following")}
                >
                  <Text style={styles.statNumber}>{followingCount}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bio section - sirf naam, tick nahi */}
            <View style={styles.bioSection}>
              <Text style={styles.name}>{name}</Text>
              {bio ? <Text style={styles.bio}>{bio}</Text> : null}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push("/edit-profile")}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
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

      <Modal visible={!!menuPostId} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuPostId(null)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => menuPostId && handleDeletePost(menuPostId)}
            >
              <Ionicons name="trash-outline" size={18} color="#ff3b30" />
              <Text style={styles.menuItemDeleteText}>Delete Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuCancel}
              onPress={() => setMenuPostId(null)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { paddingTop: 8 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  topBarUsername: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 15, fontWeight: "600", textAlign: "center" },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
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
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNumber: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#666", fontSize: 11, marginTop: 2 },
  bioSection: { paddingHorizontal: 16, marginBottom: 12 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  name: { color: "#fff", fontSize: 13, fontWeight: "600" },
  bio: { color: "#aaa", fontSize: 12, marginTop: 4, lineHeight: 18 },
  buttonRow: { paddingHorizontal: 16, marginBottom: 12 },
  editButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  editButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  postCard: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
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
    backgroundColor: "#1a1a1a",
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
  fullName: { color: "#fff", fontWeight: "700", fontSize: 14, flexShrink: 1 },
  handle: { color: "#777", fontSize: 13, flexShrink: 1 },
  caption: { color: "#eee", fontSize: 15, lineHeight: 20 },
  moreBtn: {
    padding: 4,
  },
  imageWrapper: {
    width: POST_IMAGE_WIDTH,
    height: POST_IMAGE_HEIGHT,
    marginLeft: IMAGE_LEFT_INSET,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "#262626",
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
  emptyText: { color: "#555", fontSize: 13 },
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
    backgroundColor: "#111",
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
    borderBottomColor: "#222",
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
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
});