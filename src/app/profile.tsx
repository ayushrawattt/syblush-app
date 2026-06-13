import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const [name, setName] = useState("Ayush Rawat");
  const [username, setUsername] = useState("ayush");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
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
      <Text style={styles.username}>@{username}</Text>

      <View style={styles.statsRow}>
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

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push("/edit-profile")}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

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
    paddingTop: 60,
    alignItems: "center",
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

  username: {
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

  editButton: {
    width: 280,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  editButtonText: {
    color: "#000",
    fontWeight: "bold",
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
