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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [postsCount, setPostsCount] = useState(0);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("Error loading profile:", error.message);
      return;
    }

    if (data) {
      if (data.full_name) setName(data.full_name);
      if (data.username) setUsername(data.username);
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

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

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
                style={styles.settingsButton}
                onPress={() => router.push("/settings")}
              >
                <Text style={styles.settingsIcon}>☰</Text>
              </TouchableOpacity>
            </View>

            {profileImage ? (
              <TouchableOpacity onPress={() => setShowImage(true)}>
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 45 }}>👤</Text>
              </View>
            )}

            <Text style={styles.name}>{name}</Text>
            <Text style={styles.usernameText}>@{username}</Text>

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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push("/edit-profile")}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push("/create-post")}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.gridHeader}>
              <Ionicons name="grid-outline" size={20} color="#fff" />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postThumb}
            onPress={() => router.push(`/post/${item.id}`)}  // ✅ Yahan fix kiya
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
          <Image
            source={{ uri: profileImage || "" }}
            style={styles.modalImage}
          />
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
  },
  topBar: {
    width: "100%",
    alignItems: "flex-end",
    paddingHorizontal: 30,
    marginBottom: 15,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  settingsIcon: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  usernameText: {
    color: "#777",
    fontSize: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 25,
    gap: 40,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#777",
    fontSize: 13,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  editButton: {
    width: 240,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  editButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  gridHeader: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingVertical: 10,
    alignItems: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: 320,
    height: 320,
    borderRadius: 20,
  },
});