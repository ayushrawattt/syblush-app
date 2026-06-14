import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { supabase } from "../../lib/supabase";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Post fetch karo
    const { data: postData } = await supabase
      .from("posts")
      .select("id, image_url, caption, user_id, created_at")
      .eq("id", id)
      .single();

    if (postData) {
      // Profile fetch karo
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", postData.user_id)
        .single();

      setPost({ ...postData, profiles: profile });

      // Likes fetch karo
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id);
      setLikesCount(likesCount ?? 0);

      // Check karo user ne like kiya hai ya nahi
      if (user) {
        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", id)
          .eq("user_id", user.id)
          .single();
        setLiked(!!likeData);
      }

      // Comments fetch karo
      await loadComments();
    }

    setLoading(false);
  };

  const loadComments = async () => {
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, content, user_id, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (commentsData) {
      const commentsWithProfiles = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", comment.user_id)
            .single();
          return { ...comment, profiles: profile };
        })
      );
      setComments(commentsWithProfiles);
    }
  };

  const toggleLike = async () => {
    if (!currentUserId) return;

    if (liked) {
      await supabase.from("likes").delete()
        .eq("post_id", id).eq("user_id", currentUserId);
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from("likes").insert({ post_id: id, user_id: currentUserId });
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !currentUserId) return;

    await supabase.from("comments").insert({
      post_id: id,
      user_id: currentUserId,
      content: commentText.trim(),
    });

    setCommentText("");
    await loadComments();
  };

  const deletePost = async () => {
    await supabase.from("posts").delete().eq("id", id);
    setShowDeleteModal(false);
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          {post?.user_id === currentUserId ? (
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
              <Ionicons name="trash-outline" size={22} color="#ff3b30" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {/* Post image */}
              <Image
                source={{ uri: post?.image_url }}
                style={styles.postImage}
              />

              {/* Like + Comment buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={26}
                    color={liked ? "#ff3b30" : "#fff"}
                  />
                  <Text style={styles.actionCount}>{likesCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                  <Text style={styles.actionCount}>{comments.length}</Text>
                </TouchableOpacity>
              </View>

              {/* Caption */}
              {post?.caption ? (
                <Text style={styles.caption}>
                  <Text style={styles.username}>
                    {post?.profiles?.username || "User"}{" "}
                  </Text>
                  {post.caption}
                </Text>
              ) : null}

              <Text style={styles.commentsHeader}>Comments</Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Text style={styles.commentUsername}>
                {item.profiles?.username || "User"}
              </Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.noComments}>No comments yet</Text>
          }
        />

        {/* Comment input */}
        <View style={styles.commentInput}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#555"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity onPress={addComment}>
            <Ionicons name="send" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Post?</Text>
            <Text style={styles.modalText}>
              Yeh post permanently delete ho jayegi.
            </Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={deletePost}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#111",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 16,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { color: "#fff", fontSize: 14 },
  caption: { color: "#ccc", fontSize: 14, paddingHorizontal: 16, paddingBottom: 8 },
  username: { color: "#fff", fontWeight: "600" },
  commentsHeader: {
    color: "#777",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  commentItem: { paddingHorizontal: 16, paddingVertical: 8 },
  commentUsername: { color: "#fff", fontWeight: "600", fontSize: 13 },
  commentText: { color: "#ccc", fontSize: 13, marginTop: 2 },
  noComments: { color: "#555", textAlign: "center", paddingTop: 20 },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: "center",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  modalText: { color: "#888", fontSize: 14, textAlign: "center", marginBottom: 20 },
  deleteBtn: {
    backgroundColor: "#ff3b30",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 12,
  },
  deleteBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelText: { color: "#777", fontSize: 15 },
});