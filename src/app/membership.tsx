import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image, SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Membership() {
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
      <View style={styles.card}>
  <Text style={styles.title}>Premium Membership</Text>

  <Text style={styles.desc}>
    Access premium gyms across the country with one membership.
  </Text>

  <Text style={styles.price}>₹1299</Text>

  <Text style={styles.month}>per month</Text>

  <TouchableOpacity style={styles.button}>
    <Text style={styles.buttonText}>Join Premium</Text>
  </TouchableOpacity>
</View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
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
    paddingTop: 100,
    paddingHorizontal: 20,
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  text: {
    color: "#aaa",
    fontSize: 18,
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
  card: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 15,
    width: 340,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  
  desc: {
    color: "#999",
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  
  price: {
    color: "#fff",
    fontSize: 34,
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
});