import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function EditProfile() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url, bio")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Error loading profile:", error.message);
        if (error.code === "PGRST116") {
          await supabase.from("profiles").insert({ id: user.id });
        }
        return;
      }

      if (data) {
        setName(data.full_name ?? "");
        setUsername(data.username ?? "");
        setBio(data.bio ?? "");
        setOriginalUsername(data.username ?? "");
        if (data.avatar_url) {
          setImage(data.avatar_url + "?t=" + Date.now());
        }
      }
    };

    loadProfile();
  }, []);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow access to your photos.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (localUri: string, uid: string): Promise<string | null> => {
    try {
      const uriParts = localUri.split(".");
      const ext = uriParts[uriParts.length - 1]?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      const filePath = `${uid}/avatar.${ext}`;

      if (Platform.OS === "web") {
        const response = await fetch(localUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, { contentType: mimeType, upsert: true });
        if (uploadError) { console.log("Upload error:", uploadError.message); return null; }
      } else {
        const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
        const binary = Buffer.from(base64, "base64");
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, binary, { contentType: mimeType, upsert: true });
        if (uploadError) { console.log("Upload error:", uploadError.message); return null; }
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl ?? null;
    } catch (err) {
      console.log("uploadImageToSupabase error:", err);
      return null;
    }
  };

  const deletePhoto = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setImage(null);
      await AsyncStorage.removeItem("profileImage");
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
      if (error) console.log("Delete photo error:", error.message);
      else {
        if (Platform.OS === "web") window.alert("Profile photo removed.");
        else Alert.alert("Done", "Profile photo removed.");
      }
    } catch (error) {
      console.log("deletePhoto error:", error);
    } finally {
      setLoading(false);
    }
  };

  const showPhotoOptions = () => {
    if (Platform.OS === "web") {
      pickImage();
    } else {
      Alert.alert("Profile Photo", "Choose an option", [
        { text: "Change Photo", onPress: pickImage },
        { text: "Delete Photo", onPress: deletePhoto, style: "destructive" },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const isUsernameAvailable = async (newUsername: string): Promise<boolean> => {
    if (!newUsername.trim()) return false;
    if (newUsername.trim().toLowerCase() === originalUsername.trim().toLowerCase()) return true;
    const { data, error } = await supabase.from("profiles").select("id").eq("username", newUsername.trim().toLowerCase()).maybeSingle();
    if (error) { console.log("Username check error:", error.message); return false; }
    return data === null;
  };

  const saveProfile = async () => {
    if (!userId) { if (Platform.OS === "web") window.alert("Not logged in."); else Alert.alert("Error", "Not logged in."); return; }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedBio = bio.trim();

    if (!trimmedName) { if (Platform.OS === "web") window.alert("Full name cannot be empty."); else Alert.alert("Validation", "Full name cannot be empty."); return; }
    if (!trimmedUsername) { if (Platform.OS === "web") window.alert("Username cannot be empty."); else Alert.alert("Validation", "Username cannot be empty."); return; }
    if (trimmedUsername.length < 3) { if (Platform.OS === "web") window.alert("Username must be at least 3 characters."); else Alert.alert("Invalid Username", "Username must be at least 3 characters."); return; }
    if (!/^[a-z0-9._]+$/.test(trimmedUsername)) { if (Platform.OS === "web") window.alert("Username can only contain letters, numbers, dots, and underscores."); else Alert.alert("Invalid Username", "Username can only contain letters, numbers, dots, and underscores."); return; }

    setLoading(true);

    try {
      const available = await isUsernameAvailable(trimmedUsername);
      if (!available) {
        if (Platform.OS === "web") window.alert(`"${trimmedUsername}" is already taken.`);
        else Alert.alert("Username Taken", `"${trimmedUsername}" is already taken.`);
        setLoading(false);
        return;
      }

      let avatarUrl: string | null = null;
      if (image && (image.startsWith("file://") || image.startsWith("blob:"))) {
        avatarUrl = await uploadImageToSupabase(image, userId);
        if (!avatarUrl) {
          if (Platform.OS === "web") window.alert("Could not upload profile photo.");
          else Alert.alert("Upload Failed", "Could not upload profile photo.");
          setLoading(false);
          return;
        }
        setImage(avatarUrl + "?t=" + Date.now());
      }

      const updatePayload: Record<string, string | null> = {
        full_name: trimmedName,
        username: trimmedUsername,
        bio: trimmedBio,
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl) updatePayload.avatar_url = avatarUrl;

      const { error: updateError } = await supabase.from("profiles").update(updatePayload).eq("id", userId);

      if (updateError) {
        console.log("Profile update error:", updateError.message);
        if (updateError.code === "23505") {
          if (Platform.OS === "web") window.alert(`"${trimmedUsername}" was just taken.`);
          else Alert.alert("Username Taken", `"${trimmedUsername}" was just taken.`);
        } else {
          if (Platform.OS === "web") window.alert("Failed to save profile: " + updateError.message);
          else Alert.alert("Error", "Failed to save profile: " + updateError.message);
        }
        return;
      }

      setOriginalUsername(trimmedUsername);
      setUsername(trimmedUsername);
      await AsyncStorage.setItem("name", trimmedName);
      await AsyncStorage.setItem("username", trimmedUsername);
      if (avatarUrl) await AsyncStorage.setItem("profileImage", avatarUrl);

      if (Platform.OS === "web") { window.alert("Profile saved!"); router.back(); }
      else Alert.alert("Success", "Profile saved!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      console.log("saveProfile error:", error);
      if (Platform.OS === "web") window.alert("Something went wrong.");
      else Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.8} style={styles.avatarContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>+</Text>
            </View>
          )}
          <Text style={styles.changePhoto}>Change Photo</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          placeholderTextColor="#555"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
          placeholder="Username"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Write something about yourself..."
          placeholderTextColor="#555"
          multiline
          maxLength={150}
        />
        <Text style={styles.charCount}>{bio.length}/150</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={saveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  scroll: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  avatarContainer: { alignItems: "center", marginBottom: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  changePhoto: { color: "#4a9eff", fontSize: 13, fontWeight: "500" },
  label: { alignSelf: "flex-start", color: "#888", fontSize: 11, fontWeight: "600", marginBottom: 6, letterSpacing: 0.5 },
  input: {
    width: "100%",
    backgroundColor: "#0f0f0f",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
    fontSize: 14,
  },
  bioInput: { height: 90, textAlignVertical: "top" },
  charCount: { alignSelf: "flex-end", color: "#444", fontSize: 11, marginTop: -12, marginBottom: 16 },
  button: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#000", fontWeight: "700", fontSize: 15 },
});