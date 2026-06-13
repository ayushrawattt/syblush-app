import { router, useFocusEffect } from "expo-router";
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

type NotificationItem = {
  id: string;
  actor_id: string;
  type: string;
  read: boolean;
  created_at: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, actor_id, type, read, created_at, profiles:actor_id(full_name, username, avatar_url)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.log("Load notifications error:", error.message);
      setLoading(false);
      return;
    }

    const result: NotificationItem[] = (data ?? []).map((n: any) => ({
      id: n.id,
      actor_id: n.actor_id,
      type: n.type,
      read: n.read,
      created_at: n.created_at,
      full_name: n.profiles?.full_name ?? "Someone",
      username: n.profiles?.username ?? "",
      avatar_url: n.profiles?.avatar_url ?? null,
    }));

    setNotifications(result);
    setLoading(false);

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/user-profile?id=${item.actor_id}`)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.text}>
          <Text style={styles.name}>{item.full_name}</Text>
          {item.type === "follow" ? " started following you" : " sent you something"}
        </Text>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {loading && <ActivityIndicator color="#fff" style={{ marginTop: 30 }} />}

      {!loading && notifications.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    marginRight: 12,
  },
  backText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  text: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 19,
  },
  name: {
    color: "#fff",
    fontWeight: "600",
  },
  time: {
    color: "#666",
    fontSize: 12,
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0af",
    marginLeft: 8,
  },
});