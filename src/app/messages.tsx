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

type Conversation = {
  otherUserId: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
};

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at, read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) { console.log(error.message); setLoading(false); return; }
    if (!messages || messages.length === 0) { setConversations([]); setLoading(false); return; }
    const conversationMap = new Map();
    for (const msg of messages) {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unread: msg.receiver_id === user.id && !msg.read,
        });
      }
    }
    const otherUserIds = Array.from(conversationMap.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", otherUserIds);
    if (profilesError) { console.log(profilesError.message); setLoading(false); return; }
    const result = (profiles ?? []).map((p) => {
      const convo = conversationMap.get(p.id);
      return { otherUserId: p.id, full_name: p.full_name, username: p.username, avatar_url: p.avatar_url, lastMessage: convo.lastMessage, lastMessageTime: convo.lastMessageTime, unread: convo.unread };
    });
    result.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    setConversations(result);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadConversations(); }, [loadConversations]));

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return diffMins + "m";
    if (diffHours < 24) return diffHours + "h";
    if (diffDays < 7) return diffDays + "d";
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(("/chat?id=" + item.otherUserId + "&name=" + encodeURIComponent(item.full_name)) as any)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.full_name?.charAt(0)?.toUpperCase() ?? "?"}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={[styles.lastMessage, item.unread && styles.lastMessageUnread]} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      <View style={styles.rightSide}>
        <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
        {item.unread && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
      </View>
      {loading && <ActivityIndicator color="#fff" style={{ marginTop: 30 }} />}
      {!loading && conversations.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Search for people and start a conversation!</Text>
        </View>
      )}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.otherUserId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    marginBottom: 4,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    marginRight: 12,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtext: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#0f0f0f",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  info: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  lastMessage: {
    color: "#555",
    fontSize: 12,
    marginTop: 2,
  },
  lastMessageUnread: {
    color: "#ccc",
    fontWeight: "600",
  },
  rightSide: {
    alignItems: "flex-end",
    gap: 6,
  },
  time: {
    color: "#444",
    fontSize: 11,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#0af",
  },
});