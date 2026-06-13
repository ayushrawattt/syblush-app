import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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

type ProfileItem = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
};

export default function FollowList() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [users, setUsers] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const title = type === "following" ? "Following" : "Followers";

  const loadUsers = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const column = type === "following" ? "follower_id" : "following_id";
    const targetColumn = type === "following" ? "following_id" : "follower_id";

    const { data: followRows, error } = await supabase
      .from("follows")
      .select(targetColumn)
      .eq(column, user.id);

    if (error) {
      console.log("Error loading follow list:", error.message);
      setLoading(false);
      return;
    }

    const ids = (followRows ?? []).map((row: any) => row[targetColumn]);

    if (ids.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", ids);

    if (profileError) {
      console.log("Error loading profiles:", profileError.message);
    }

    setUsers(profiles ?? []);
    setLoading(false);
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>{"<"}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No {title.toLowerCase()} yet</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/user-profile?id=${item.id}`)}
            >
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontSize: 16 }}>👤</Text>
                </View>
              )}
              <View>
                <Text style={styles.name}>{item.full_name || item.username}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  username: {
    color: "#777",
    fontSize: 11,
    marginTop: 1,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 40,
    fontSize: 13,
  },
});