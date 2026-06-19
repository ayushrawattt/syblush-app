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
import { supabase } from "../lib/supabase";

const SCREEN_WIDTH = Dimensions.get("window").width;
const POST_SIZE = SCREEN_WIDTH / 3;

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

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url, bio")
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
      .select("id, image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
    setPostsCount(postsData?.length ?? 0);
  };

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push("/create-post")}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>@{username}</Text>
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
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
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
          <Image source={{ uri: profileImage || "" }} style={styles.modalImage} />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: 300, height: 300, borderRadius: 16 },
});