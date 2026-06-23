import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
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

type FollowedUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name: string;
};

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    if (myProfile?.username) setCurrentUsername(myProfile.username);

    const { data: followsData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followsData && followsData.length > 0) {
      const followingIds = followsData.map((f) => f.following_id);
      const { data: followedProfiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name")
        .in("id", followingIds);
      setFollowedUsers(followedProfiles ?? []);
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at, read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !messages) { setLoading(false); return; }

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
    if (otherUserIds.length === 0) { setConversations([]); setLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", otherUserIds);

    const result = (profiles ?? []).map((p) => {
      const convo = conversationMap.get(p.id);
      return {
        otherUserId: p.id,
        full_name: p.full_name,
        username: p.username,
        avatar_url: p.avatar_url,
        lastMessage: convo.lastMessage,
        lastMessageTime: convo.lastMessageTime,
        unread: convo.unread,
      };
    });

    result.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    setConversations(result);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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
        <Text style={[styles.lastMessage, item.unread && styles.lastMessageUnread]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.rightSide}>
        <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
        {item.unread && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* TOP HEADER - back + username center */}
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {currentUsername ? currentUsername : "Messages"}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* SEARCH BAR - Instagram style */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push("/search" as any)}
          activeOpacity={0.7}
        >
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="11" cy="11" r="8" />
            <Line x1="21" y1="21" x2="16.65" y2="16.65" />
          </Svg>
          <Text style={styles.searchBarPlaceholder}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* FOLLOWED USERS - stories style */}
      {followedUsers.length > 0 && (
        <View style={styles.storiesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesScroll}
          >
            {followedUsers.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.storyItem}
                onPress={() => router.push(("/chat?id=" + u.id + "&name=" + encodeURIComponent(u.full_name)) as any)}
              >
                {u.avatar_url ? (
                  <Image source={{ uri: u.avatar_url }} style={styles.storyAvatar} />
                ) : (
                  <View style={styles.storyAvatarPlaceholder}>
                    <Text style={styles.storyAvatarText}>
                      {u.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                )}
                <Text style={styles.storyUsername} numberOfLines={1}>
                  {u.username ?? u.full_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* MESSAGES LIST */}
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchBarPlaceholder: {
    color: "#555",
    fontSize: 14,
  },
  storiesSection: {
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    paddingVertical: 12,
  },
  storiesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: "center",
    width: 64,
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#e91e8c",
  },
  storyAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e91e8c",
  },
  storyAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  storyUsername: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
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