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
  const [originalUsername, setOriginalUsername] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ─── Load profile from Supabase on mount ─────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Error loading profile:", error.message);
        // If no profile row exists yet, create one
        if (error.code === "PGRST116") {
          await supabase.from("profiles").insert({ id: user.id });
        }
        return;
      }

      if (data) {
        setName(data.full_name ?? "");
        setUsername(data.username ?? "");
        setOriginalUsername(data.username ?? "");
        if (data.avatar_url) {
          // Add cache-busting so image always reloads fresh from Supabase
          setImage(data.avatar_url + "?t=" + Date.now());
        }
      }
    };

    loadProfile();
  }, []);

  // ─── Pick image from gallery ──────────────────────────────────────────────
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

  // ─── Upload image to Supabase Storage ────────────────────────────────────
  // Uses fetch + blob — works in React Native (no atob needed)
  const uploadImageToSupabase = async (
    localUri: string,
    uid: string,
  ): Promise<string | null> => {
    try {
      // Determine file extension
      const uriParts = localUri.split(".");
      const ext = uriParts[uriParts.length - 1]?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      // Store per-user, overwrite on each update
      const filePath = `${uid}/avatar.${ext}`;

      // Read as base64 via expo-file-system (works on device & simulator)
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 string → Uint8Array without atob (atob breaks in RN)
      const binary = Buffer.from(base64, "base64");

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, binary, {
          contentType: mimeType,
          upsert: true, // overwrite previous avatar
        });

      if (uploadError) {
        console.log("Upload error:", uploadError.message);
        return null;
      }

      // Return the permanent public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl ?? null;
    } catch (err) {
      console.log("uploadImageToSupabase error:", err);
      return null;
    }
  };

  // ─── Delete photo ─────────────────────────────────────────────────────────
  const deletePhoto = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setImage(null);
      await AsyncStorage.removeItem("profileImage");

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) console.log("Delete photo error:", error.message);
      else Alert.alert("Done", "Profile photo removed.");
    } catch (error) {
      console.log("deletePhoto error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Photo options alert ──────────────────────────────────────────────────
  const showPhotoOptions = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "Change Photo", onPress: pickImage },
      { text: "Delete Photo", onPress: deletePhoto, style: "destructive" },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ─── Check username availability ──────────────────────────────────────────
  const isUsernameAvailable = async (newUsername: string): Promise<boolean> => {
    if (!newUsername.trim()) return false;

    // User is keeping the same username — always fine
    if (
      newUsername.trim().toLowerCase() === originalUsername.trim().toLowerCase()
    ) {
      return true;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", newUsername.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.log("Username check error:", error.message);
      return false;
    }

    return data === null; // null = no one has this username → available
  };

  // ─── Save profile ─────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!userId) {
      Alert.alert("Error", "Not logged in.");
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Validation", "Full name cannot be empty.");
      return;
    }
    if (!trimmedUsername) {
      Alert.alert("Validation", "Username cannot be empty.");
      return;
    }
    // Basic username format check
    if (!/^[a-z0-9._]+$/.test(trimmedUsername)) {
      Alert.alert(
        "Invalid Username",
        "Username can only contain letters, numbers, dots, and underscores.",
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Check username is available
      const available = await isUsernameAvailable(trimmedUsername);
      if (!available) {
        Alert.alert(
          "Username Taken",
          `"${trimmedUsername}" is already taken. Please choose another.`,
        );
        setLoading(false);
        return;
      }

      // 2. Upload avatar if a new local image was picked
      let avatarUrl: string | null = null;
      if (image && image.startsWith("file://")) {
        avatarUrl = await uploadImageToSupabase(image, userId);
        if (!avatarUrl) {
          Alert.alert(
            "Upload Failed",
            "Could not upload profile photo. Check your internet and try again.",
          );
          setLoading(false);
          return;
        }
        setImage(avatarUrl + "?t=" + Date.now()); // update state with permanent URL
      }

      // 3. Build update object
      const updatePayload: Record<string, string | null> = {
        full_name: trimmedName,
        username: trimmedUsername,
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl) {
        updatePayload.avatar_url = avatarUrl;
      }

      // 4. Save to Supabase profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);

      if (updateError) {
        console.log("Profile update error:", updateError.message);
        Alert.alert("Error", "Failed to save profile: " + updateError.message);
        return;
      }

      // 5. Lock in new username as "original" so re-saves don't block
      setOriginalUsername(trimmedUsername);

      // 6. Cache locally for quick reads elsewhere in the app
      await AsyncStorage.setItem("name", trimmedName);
      await AsyncStorage.setItem("username", trimmedUsername);
      if (avatarUrl) {
        await AsyncStorage.setItem("profileImage", avatarUrl);
      }

      Alert.alert("Success", "Profile saved!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.log("saveProfile error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Avatar tap → photo options */}
      <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.8}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={showPhotoOptions}>
        <Text style={styles.changePhoto}>Change Profile Photo</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Edit Profile</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Full Name"
        placeholderTextColor="#666"
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        value={username}
        onChangeText={(text) =>
          setUsername(text.toLowerCase().replace(/[^a-z0-9._]/g, ""))
        }
        placeholder="Username"
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 80,
    alignItems: "center",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  changePhoto: {
    color: "#fff",
    marginBottom: 25,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
  },
  input: {
    width: 280,
    backgroundColor: "#111",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
    fontSize: 14,
  },
  button: {
    width: 280,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  backText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
