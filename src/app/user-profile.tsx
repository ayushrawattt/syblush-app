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
      .select("id, full_name, username, avatar_url")
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

    // ✅ Posts fetch karo
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.notFound}>User not found.</Text>
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUserId === id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>{"<"}</Text>
      </TouchableOpacity>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Avatar */}
            {profile.avatar_url ? (
              <TouchableOpacity onPress={() => setShowImage(true)} activeOpacity={0.8}>
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}

            <Text style={styles.name}>{profile.full_name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            {/* Follow + Message buttons */}
            {!isOwnProfile && (
              <View style={styles.actionRow}>
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

            {/* Grid header */}
            <View style={styles.gridHeader} />
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postThumb}
            onPress={() => router.push(`/post/${item.id}`)}
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
          activeOpacity={1}
        >
          <Image source={{ uri: profile.avatar_url || "" }} style={styles.modalImage} />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    zIndex: 10,
  },
  backText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  username: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 25,
  },
  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#222",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
  },
  followButton: {
    backgroundColor: "#fff",
  },
  followButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  followingButton: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
  },
  followingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  messageButton: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
  },
  messageButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  gridHeader: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingVertical: 10,
  },
  postThumb: {
    width: POST_SIZE,
    height: POST_SIZE,
  },
  postImage: {
    width: POST_SIZE - 2,
    height: POST_SIZE - 2,
    margin: 1,
    backgroundColor: "#111",
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#555",
    fontSize: 16,
  },
  notFound: {
    color: "#666",
    textAlign: "center",
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: 320,
    height: 320,
    borderRadius: 20,
  },
});