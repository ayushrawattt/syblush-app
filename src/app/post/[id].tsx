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

const BackIcon = () => <Text style={{color:"#fff",fontSize:20}}>←</Text>;
const TrashIcon = () => <Text style={{color:"#ff3b30",fontSize:18}}>🗑</Text>;
const HeartIcon = ({ filled }: { filled: boolean }) => <Text style={{fontSize:22}}>{filled ? "❤️" : "🤍"}</Text>;
const ChatIcon = () => <Text style={{fontSize:22}}>💬</Text>;
const RepeatIcon = ({ active }: { active: boolean }) => <Text style={{fontSize:22}}>{active ? "🔁" : "🔄"}</Text>;
const SendIcon = () => <Text style={{color:"#007AFF",fontSize:18}}>➤</Text>;

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
  const [reposted, setReposted] = useState(false);
  const [repostsCount, setRepostsCount] = useState(0);
  const [showRepostModal, setShowRepostModal] = useState(false);

  useEffect(() => { loadPost(); }, [id]);

  const loadPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
    const { data: postData } = await supabase.from("posts").select("id, image_url, caption, user_id, created_at").eq("id", id).single();
    if (postData) {
      const { data: profile } = await supabase.from("profiles").select("username, avatar_url").eq("id", postData.user_id).single();
      setPost({ ...postData, profiles: profile });
      const { count: lCount } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", id);
      setLikesCount(lCount ?? 0);
      if (user) {
        const { data: likeData } = await supabase.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).single();
        setLiked(!!likeData);
        const { data: repostData } = await supabase.from("reposts").select("id").eq("post_id", id).eq("user_id", user.id).single();
        setReposted(!!repostData);
      }
      const { count: rCount } = await supabase.from("reposts").select("*", { count: "exact", head: true }).eq("post_id", id);
      setRepostsCount(rCount ?? 0);
      await loadComments();
    }
    setLoading(false);
  };

  const loadComments = async () => {
    const { data: commentsData } = await supabase.from("comments").select("id, content, user_id, created_at").eq("post_id", id).order("created_at", { ascending: true });
    if (commentsData) {
      const commentsWithProfiles = await Promise.all(commentsData.map(async (comment) => {
        const { data: profile } = await supabase.from("profiles").select("username, avatar_url").eq("id", comment.user_id).single();
        return { ...comment, profiles: profile };
      }));
      setComments(commentsWithProfiles);
    }
  };

  const toggleLike = async () => {
    if (!currentUserId) return;
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", id).eq("user_id", currentUserId);
      setLiked(false); setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from("likes").insert({ post_id: id, user_id: currentUserId });
      setLiked(true); setLikesCount((prev) => prev + 1);
    }
  };

  const toggleRepost = async () => {
    if (!currentUserId) return;
    if (reposted) {
      await supabase.from("reposts").delete().eq("post_id", id).eq("user_id", currentUserId);
      setReposted(false); setRepostsCount((prev) => prev - 1);
    } else {
      await supabase.from("reposts").insert({ post_id: id, user_id: currentUserId, original_user_id: post?.user_id });
      setReposted(true); setRepostsCount((prev) => prev + 1);
    }
    setShowRepostModal(false);
  };

  const addComment = async () => {
    if (!commentText.trim() || !currentUserId) return;
    await supabase.from("comments").insert({ post_id: id, user_id: currentUserId, content: commentText.trim() });
    setCommentText(""); await loadComments();
  };

  const deletePost = async () => {
    await supabase.from("posts").delete().eq("id", id);
    setShowDeleteModal(false); router.back();
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator color="#fff" size="large" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><BackIcon /></TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          {post?.user_id === currentUserId ? (
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}><TrashIcon /></TouchableOpacity>
          ) : <View style={{ width: 24 }} />}
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<>
            <Image source={{ uri: post?.image_url }} style={styles.postImage} resizeMode="cover" />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
                <HeartIcon filled={liked} />
                <Text style={styles.actionCount}>{likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <ChatIcon />
                <Text style={styles.actionCount}>{comments.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowRepostModal(true)}>
                <RepeatIcon active={reposted} />
                <Text style={[styles.actionCount, reposted && { color: "#00c853" }]}>{repostsCount}</Text>
              </TouchableOpacity>
            </View>
            {post?.caption ? <Text style={styles.caption}><Text style={styles.username}>{post?.profiles?.username || "User"} </Text>{post.caption}</Text> : null}
            <Text style={styles.commentsHeader}>Comments</Text>
          </>}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Text style={styles.commentUsername}>{item.profiles?.username || "User"}</Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noComments}>No comments yet</Text>}
        />

        <View style={styles.commentInput}>
          <TextInput style={styles.input} placeholder="Add a comment..." placeholderTextColor="#555" value={commentText} onChangeText={setCommentText} />
          <TouchableOpacity onPress={addComment}><SendIcon /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showRepostModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <RepeatIcon active={reposted} />
            <Text style={styles.modalTitle}>{reposted ? "Remove Repost?" : "Repost?"}</Text>
            <Text style={styles.modalText}>{reposted ? "This will be removed from your reposts." : "This will appear on your profile under Reposts."}</Text>
            <TouchableOpacity style={[styles.repostBtn, reposted && { backgroundColor: "#ff3b30" }]} onPress={toggleRepost}>
              <Text style={styles.repostBtnText}>{reposted ? "Remove" : "Repost"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRepostModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Post?</Text>
            <Text style={styles.modalText}>Yeh post permanently delete ho jayegi.</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={deletePost}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDeleteModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#222" },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  postImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.6, backgroundColor: "#111" },
  actions: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { color: "#fff", fontSize: 14 },
  caption: { color: "#ccc", fontSize: 14, paddingHorizontal: 16, paddingBottom: 8 },
  username: { color: "#fff", fontWeight: "600" },
  commentsHeader: { color: "#777", fontSize: 13, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#222" },
  commentItem: { paddingHorizontal: 16, paddingVertical: 8 },
  commentUsername: { color: "#fff", fontWeight: "600", fontSize: 13 },
  commentText: { color: "#ccc", fontSize: 13, marginTop: 2 },
  noComments: { color: "#555", textAlign: "center", paddingTop: 20 },
  commentInput: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#222", gap: 10 },
  input: { flex: 1, backgroundColor: "#111", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: "#fff", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#1a1a1a", borderRadius: 16, padding: 24, width: 300, alignItems: "center" },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  modalText: { color: "#888", fontSize: 14, textAlign: "center", marginBottom: 20 },
  repostBtn: { backgroundColor: "#00c853", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10, marginBottom: 12 },
  repostBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  deleteBtn: { backgroundColor: "#ff3b30", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10, marginBottom: 12 },
  deleteBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelText: { color: "#777", fontSize: 15 },
});