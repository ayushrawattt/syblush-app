import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
};

export default function UserProfile() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, is_verified")
      .eq("id", id)
      .single();

    if (profileError) {
      console.log("Profile load error:", profileError.message);
    } else {
      setProfile(profileData);
    }

    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", id);
    setFollowersCount(followers ?? 0);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id);
    setFollowingCount(following ?? 0);

    const { data: postsData } = await supabase
      .from("posts")
      .select("id, image_url, caption, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setPosts(postsData || []);
    setPostsCount(postsData?.length ?? 0);

    if (user && user.id !== id) {
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", id)
        .maybeSingle();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleFollow = async () => {
    if (!currentUserId || !id) return;
    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", id);

      if (!error) {
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: id });

      if (!error) {
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    }

    setFollowLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <View style={styles.iconBtn} />
        </View>
        <Text style={[styles.notFound, { color: colors.subtextAlt }]}>User not found.</Text>
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUserId === id;

  const renderPost = ({ item }: any) => (
    <View style={[styles.postCard, { borderBottomColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.cardAlt }]}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={16} color={colors.subtextAlt} />
          )}
        </View>

        <View style={styles.headerTextCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>
              {profile.full_name}
            </Text>
            <Text style={[styles.handle, { color: colors.subtext }]} numberOfLines={1}>
              @{profile.username}
            </Text>
            {profile.is_verified && <VerifiedBadge />}
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
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text }]}>@{profile.username}</Text>
                {profile.is_verified && <VerifiedBadge />}
              </View>
              <View style={styles.iconBtn} />
            </View>

            <View style={styles.profileRow}>
              <TouchableOpacity onPress={() => setShowImage(true)}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.bigAvatar} />
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
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{followersCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtextAlt }]}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.subtextAlt }]}>Following</Text>
                </View>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={[styles.name, { color: colors.text }]}>{profile.full_name}</Text>
              {profile.bio ? <Text style={[styles.bio, { color: colors.subtext }]}>{profile.bio}</Text> : null}
            </View>

            {!isOwnProfile && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isFollowing
                      ? { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }
                      : { backgroundColor: colors.text },
                  ]}
                  onPress={toggleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator color={isFollowing ? colors.text : colors.background} size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.followButtonText,
                        { color: isFollowing ? colors.text : colors.background },
                      ]}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() =>
                    router.push(`/chat?id=${profile.id}&name=${encodeURIComponent(profile.full_name)}`)
                  }
                >
                  <Text style={[styles.messageButtonText, { color: colors.text }]}>Message</Text>
                </TouchableOpacity>
              </View>
            )}
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
          activeOpacity={1}
        >
          <Image source={{ uri: profile.avatar_url || "" }} style={styles.modalImage} />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 8 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
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
  name: { fontSize: 13, fontWeight: "600" },
  bio: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonText: { fontWeight: "600", fontSize: 13 },
  messageButtonText: { fontWeight: "600", fontSize: 13 },

  // ✅ X-style feed post card
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  fullName: { fontWeight: "700", fontSize: 14, flexShrink: 1 },
  handle: { fontSize: 13, flexShrink: 1 },
  caption: { fontSize: 15, lineHeight: 20 },
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
  notFound: { textAlign: "center", marginTop: 100 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: 300, height: 300, borderRadius: 16 },
});