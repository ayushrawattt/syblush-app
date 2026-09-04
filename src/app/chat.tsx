import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function Chat() {
  const { colors } = useTheme();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [otherUserUsername, setOtherUserUsername] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async (uid: string) => {
    if (!id) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${uid},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${uid})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Load messages error:", error.message);
      return;
    }

    setMessages(data ?? []);

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", id)
      .eq("receiver_id", uid)
      .eq("read", false);
  }, [id]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUserId(user.id);
      await loadMessages(user.id);

      // Load other user's avatar and username
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", id)
        .single();

      if (profile) {
        setOtherUserAvatar(profile.avatar_url ?? null);
        setOtherUserUsername(profile.username ?? null);
      }
    };

    init();
  }, [loadMessages]);

  useEffect(() => {
    if (!currentUserId || !id) return;

    const channel = supabase
      .channel(`chat-${currentUserId}-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const belongsToChat =
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === id) ||
            (newMsg.sender_id === id && newMsg.receiver_id === currentUserId);

          if (belongsToChat) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUserId || !id || sending) return;

    setSending(true);
    setText("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: id,
        content: trimmed,
      })
      .select()
      .single();

    if (error) {
      console.log("Send message error:", error.message);
      setText(trimmed);
    } else if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
    }

    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === currentUserId;
    return (
      <View style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}>
        {!isMine && (
          <TouchableOpacity onPress={() => router.push(`/user-profile?id=${id}`)}>
            {otherUserAvatar ? (
              <Image source={{ uri: otherUserAvatar }} style={styles.messageAvatar} />
            ) : (
              <View style={[styles.messageAvatarPlaceholder, { backgroundColor: colors.cardAlt }]}>
                <Text style={[styles.messageAvatarText, { color: colors.text }]}>
                  {(name ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        <View
          style={[
            styles.messageBubble,
            isMine
              ? [styles.myMessage, { backgroundColor: colors.text }]
              : [styles.theirMessage, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}
        >
          <Text style={isMine ? [styles.myMessageText, { color: colors.background }] : [styles.theirMessageText, { color: colors.text }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backText, { color: colors.text }]}>{"<"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => router.push(`/user-profile?id=${id}`)}
          activeOpacity={0.7}
        >
          {otherUserAvatar ? (
            <Image source={{ uri: otherUserAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.headerAvatarText, { color: colors.text }]}>
                {(name ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>{name ?? "Chat"}</Text>
            {otherUserUsername && (
              <Text style={[styles.headerUsername, { color: colors.subtextAlt }]}>@{otherUserUsername}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        <View style={[styles.inputRow, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.subtextAlt}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.text },
              (!text.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            <Text style={[styles.sendButtonText, { color: colors.background }]}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 12,
  },
  backText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  headerUsername: {
    fontSize: 12,
    marginTop: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
    gap: 8,
  },
  myRow: {
    justifyContent: "flex-end",
  },
  theirRow: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  messageAvatarText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  myMessageText: {
    fontSize: 14,
  },
  theirMessageText: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});