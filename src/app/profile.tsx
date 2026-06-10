import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Profile() {
const [name, setName] = useState("Ayush Rawat");
const [username, setUsername] = useState("ayush");
const [profileImage, setProfileImage] = useState<string | null>(null);
const [showImage, setShowImage] = useState(false);

const loadProfile = async () => {
const savedName = await AsyncStorage.getItem("name");
const savedUsername = await AsyncStorage.getItem("username");
const savedImage = await AsyncStorage.getItem("profileImage");
if (savedName) setName(savedName);
if (savedUsername) setUsername(savedUsername);
if (savedImage) setProfileImage(savedImage);

};

useFocusEffect(
useCallback(() => {
loadProfile();
}, [])
);

return (
<SafeAreaView style={styles.container}>
<View style={styles.topBar}>
<TouchableOpacity
  style={styles.settingsButton}
  onPress={() => router.push("/settings")}
>
  <Text style={styles.settingsIcon}>☰</Text>
</TouchableOpacity>
</View>

{profileImage ? (
  <TouchableOpacity onPress={() => setShowImage(true)}>
  <Image
    source={{ uri: profileImage }}
    style={styles.avatar}
  />
</TouchableOpacity>
) : (
  <View
  style={{
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  }}
>
  <Text style={{ fontSize: 45 }}>👤</Text>
</View>
)}

  <Text style={styles.name}>{name}</Text>

  <Text style={styles.username}>@{username}</Text>

  <TouchableOpacity
    style={styles.editButton}
    onPress={() => router.push("/edit-profile")}
  >
    <Text style={styles.editButtonText}>
      Edit Profile
    </Text>
  </TouchableOpacity>


  <View style={styles.bottomNav}>
    <TouchableOpacity
      style={styles.navItem}
      onPress={() => router.push("/explore")}
    >
      <Text style={styles.navIcon}>🏠</Text>
      <Text style={styles.navText}>Home</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.navItem}
      onPress={() => router.push("/membership")}
    >
      <Text style={styles.navIcon}>💳</Text>
      <Text style={styles.navText}>Membership</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItem}>
  {profileImage ? (
    <Image
      source={{ uri: profileImage }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        marginBottom: 6,
      }}
    />
  ) : (
    <Text style={styles.navIcon}>👤</Text>
  )}

  <Text style={styles.navText}>Profile</Text>
</TouchableOpacity>
  </View>
  <Modal
  visible={showImage}
  transparent={true}
  animationType="fade"
>
  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    }}
    onPress={() => setShowImage(false)}
  >
    <Image
      source={{ uri: profileImage || "" }}
      style={{
        width: 320,
        height: 320,
        borderRadius: 20,
      }}
    />
  </TouchableOpacity>
</Modal>
</SafeAreaView>

);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: "#000",
paddingTop: 60,
alignItems: "center",
},

topBar: {
width: "100%",
alignItems: "flex-end",
paddingHorizontal: 30,
marginBottom: 15,
},

settingsIcon: {
  fontSize: 18,
  color: "#fff",
  fontWeight: "bold",
},
settingsButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#111",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#222",
},

avatar: {
  width: 90,
  height: 90,
  borderRadius: 45,
  marginBottom: 20,
},

avatarText: {
color: "#fff",
fontSize: 36,
fontWeight: "bold",
},

name: {
color: "#fff",
fontSize: 24,
fontWeight: "bold",
marginBottom: 4,
},

username: {
color: "#777",
fontSize: 16,
marginBottom: 25,
},

email: {
color: "#999",
fontSize: 15,
marginBottom: 35,
},

editButton: {
width: 280,
backgroundColor: "#fff",
padding: 14,
borderRadius: 12,
alignItems: "center",
marginBottom: 12,
},

editButtonText: {
color: "#000",
fontWeight: "bold",
fontSize: 16,
},

logoutButton: {
width: 280,
backgroundColor: "#222",
padding: 14,
borderRadius: 12,
alignItems: "center",
},

logoutButtonText: {
color: "#fff",
fontWeight: "bold",
fontSize: 16,
},

bottomNav: {
position: "absolute",
bottom: 20,
left: 20,
right: 20,
backgroundColor: "#111",
borderRadius: 20,
flexDirection: "row",
justifyContent: "space-around",
paddingVertical: 15,
borderWidth: 1,
borderColor: "#222",
},

navItem: {
alignItems: "center",
},

navIcon: {
fontSize: 20,
marginBottom: 4,
},

navText: {
color: "#fff",
fontSize: 12,
},
});