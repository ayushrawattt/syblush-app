import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

  export default function Explore() {

    const [profileImage, setProfileImage] = useState(null);
    
    useFocusEffect(
      useCallback(() => {
        const loadImage = async () => {
          const img = await AsyncStorage.getItem("profileImage");
          setProfileImage(img);
        };
    
        loadImage();
      }, [])
    );
    
  return (
    <SafeAreaView style={styles.container}>
      

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
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

        <TouchableOpacity
  style={styles.navItem}
  onPress={() => router.push("/profile")}
>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
    paddingHorizontal: 20,
  },

  logo: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
    marginLeft: 10,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    width: 340,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#222",
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  desc: {
    color: "#999",
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
  },

  price: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
  },

  month: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 25,
  },

  button: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
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