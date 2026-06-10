import { router } from "expo-router";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Settings() {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
  style={styles.backButton}
  onPress={() => router.back()}
>
  <Text style={styles.backText}>←</Text>
</TouchableOpacity>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.optionTitle}>Email</Text>
        <Text style={styles.optionValue}>ayush@example.com</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
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

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
  },

  card: {
    width: 320,
    backgroundColor: "#111",
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 20,
  },

  optionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  optionValue: {
    color: "#888",
    fontSize: 14,
    marginTop: 5,
  },

  logoutButton: {
    width: 320,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },

  logoutText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
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