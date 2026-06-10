import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function EditProfile() {
const [name, setName] = useState("Ayush Rawat");
const [username, setUsername] = useState("ayush");
const [image, setImage] = useState<string | null>(null);
const [showOptions, setShowOptions] = useState(false);
useEffect(() => {
  const loadImage = async () => {
    const savedImage = await AsyncStorage.getItem("profileImage");

    if (savedImage) {
      setImage(savedImage);
    }
  };

  loadImage();
}, []);

const pickImage = async () => {
const result = await ImagePicker.launchImageLibraryAsync({
allowsEditing: true,
aspect: [1, 1],
quality: 1,
});

if (!result.canceled) {
  setImage(result.assets[0].uri);
}

};

const showPhotoOptions = () => {
  Alert.alert(
    "Profile Photo",
    "Choose an option",
    [
      {
        text: "Edit Image",
        onPress: pickImage,
      },
      {
        text: "Delete Image",
        onPress: deletePhoto,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]
  );
};
const deletePhoto = async () => {
  try {
    setImage(null);
    await AsyncStorage.removeItem("profileImage");
    router.back();
  } catch (error) {
    console.log(error);
  }
};
const saveProfile = async () => {
try {
await AsyncStorage.setItem("name", name);
await AsyncStorage.setItem("username", username);

  if (image) {
    await AsyncStorage.setItem("profileImage", image);
  }

} catch (error) {
  console.log(error);
}

};

return (
<SafeAreaView style={styles.container}>
<TouchableOpacity
  style={styles.backButton}
  onPress={() => router.back()}
>
  <Text style={styles.backText}>←</Text>
</TouchableOpacity>
<TouchableOpacity
  onPress={() => setShowOptions(!showOptions)}
>
{image ? (
<Image source={{ uri: image }} style={styles.avatar} />
) : (
<TouchableOpacity
style={styles.avatarPlaceholder}
onPress={pickImage}
>
<Text style={styles.avatarText}>+</Text>
</TouchableOpacity>
)}
</TouchableOpacity>

  <Text style={styles.changePhoto}>
    Change Profile Photo
  </Text>
  {showOptions && (
  <>
    <TouchableOpacity
      style={{
        width: 200,
        backgroundColor: "#111",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 10,
      }}
      onPress={pickImage}
    >
      <Text style={{ color: "#fff" }}>
        Edit Image
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={{
        width: 200,
        backgroundColor: "#111",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 15,
      }}
      onPress={deletePhoto}
    >
      <Text style={{ color: "red" }}>
        Delete Image
      </Text>
    </TouchableOpacity>
  </>
)}

  <Text style={styles.title}>Edit Profile</Text>

  <TextInput
    style={styles.input}
    value={name}
    onChangeText={setName}
    placeholder="Full Name"
    placeholderTextColor="#666"
  />

  <TextInput
    style={styles.input}
    value={username}
    onChangeText={setUsername}
    placeholder="Username"
    placeholderTextColor="#666"
  />

  <TouchableOpacity
    style={styles.button}
    onPress={saveProfile}
  >
    <Text style={styles.buttonText}>Save Changes</Text>
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