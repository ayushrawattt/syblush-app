import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function CreatePost() {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadPost = async () => {
    if (!image) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setLoading(true);
    console.log("1. Starting upload...");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log("2. User:", userData?.user?.id, "Error:", userError);
      if (userError || !userData?.user) throw new Error("User not logged in");

      const userId = userData.user.id;
      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();
      console.log("3. Image fetched, size:", arrayBuffer.byteLength);

      const fileExt = image.split(".").pop() || "jpg";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      console.log("4. Uploading to storage:", fileName);

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, arrayBuffer, { contentType: `image/${fileExt}` });

      console.log("5. Upload error:", uploadError);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("posts").getPublicUrl(fileName);
      console.log("6. Public URL:", publicUrlData.publicUrl);

      const { error: insertError } = await supabase.from("posts").insert({
        user_id: userId,
        image_url: publicUrlData.publicUrl,
        caption: caption,
      });

      console.log("7. Insert error:", insertError);
      if (insertError) throw insertError;

      Alert.alert("Success", "Post uploaded!");
      setImage(null);
      setCaption("");
      router.push("/");
    } catch (error: any) {
      console.log("CAUGHT ERROR:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.imagePickerText}>Tap to select a photo</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Write a caption..."
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={uploadPost} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Share Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  imagePicker: {
    width: "100%",
    height: 300,
    backgroundColor: "#eee",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imagePickerText: {
    color: "#888",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
