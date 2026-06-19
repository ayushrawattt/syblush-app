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
import { supabase } from "../lib/supabase";

const SCREEN_WIDTH = Dimensions.get("window").width;
const POST_SIZE = SCREEN_WIDTH / 3;

type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export default function UserProfile() {
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
      .select("id, full_name, username, avatar_url, bio")
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
      .select("id, image_url")
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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#fff" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.iconBtn} />
        </View>
        <Text style={styles.notFound}>User not found.</Text>
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUserId === id;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>@{profile.username}</Text>
              <View style={styles.iconBtn} />
            </View>

            <View style={styles.profileRow}>
              <TouchableOpacity onPress={() => setShowImage(true)}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={28} color="#555" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{postsCount}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followingCount}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.name}>{profile.full_name}</Text>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            </View>

            {!isOwnProfile && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isFollowing ? styles.followingButton : styles.followButton,
                  ]}
                  onPress={toggleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <ActivityIndicator color={isFollowing ? "#fff" : "#000"} size="small" />
                  ) : (
                    <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={() =>
                    router.push(`/chat?id=${profile.id}&name=${encodeURIComponent(profile.full_name)}`)
                  }
                >
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.gridHeader}>
              <Ionicons name="grid-outline" size={18} color="#fff" />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postThumb}
            onPress={() => router.push(`/post/${item.id}` as any)}
          >
            <Image source={{ uri: item.image_url }} style={styles.postImage} />
          </TouchableOpacity>
        )}
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
          <Image source={{ uri: profile.avatar_url || "" }} style={styles.modalImage} />
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
  title: { color: "#fff", fontSize: 15, fontWeight: "600", textAlign: "center", flex: 1 },
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
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
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
  name: { color: "#fff", fontSize: 13, fontWeight: "600" },
  bio: { color: "#aaa", fontSize: 12, marginTop: 4, lineHeight: 18 },
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
  followButton: { backgroundColor: "#fff" },
  followButtonText: { color: "#000", fontWeight: "600", fontSize: 13 },
  followingButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  followingButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  messageButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  messageButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  gridHeader: {
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingVertical: 8,
    alignItems: "center",
  },
  postThumb: { width: POST_SIZE, height: POST_SIZE },
  postImage: {
    width: POST_SIZE - 2,
    height: POST_SIZE - 2,
    margin: 1,
    backgroundColor: "#111",
  },
  emptyContainer: { paddingTop: 40, alignItems: "center" },
  emptyText: { color: "#555", fontSize: 13 },
  notFound: { color: "#666", textAlign: "center", marginTop: 100 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: 300, height: 300, borderRadius: 16 },
});