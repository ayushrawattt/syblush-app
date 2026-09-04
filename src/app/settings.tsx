import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const { colors, mode, setThemeMode } = useTheme();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.dismissAll();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.back()}
      >
        <Text style={[styles.backText, { color: colors.text }]}>{"<"}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>Email</Text>
        <Text style={[styles.optionValue, { color: colors.subtext }]}>ayush@example.com</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[styles.optionTitle, { color: colors.text, marginBottom: 12 }]}>Appearance</Text>

        <View style={styles.themeRow}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: colors.border },
              mode === "dark" && styles.themeOptionActive,
            ]}
            onPress={() => setThemeMode("dark")}
            activeOpacity={0.7}
          >
            <Ionicons name="moon" size={18} color={mode === "dark" ? "#fff" : colors.subtext} />
            <Text style={[styles.themeOptionText, { color: mode === "dark" ? "#fff" : colors.subtext }]}>
              Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              { borderColor: colors.border },
              mode === "light" && styles.themeOptionActiveLight,
            ]}
            onPress={() => setThemeMode("light")}
            activeOpacity={0.7}
          >
            <Ionicons name="sunny" size={18} color={mode === "light" ? "#000" : colors.subtext} />
            <Text style={[styles.themeOptionText, { color: mode === "light" ? "#000" : colors.subtext }]}>
              Light
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
  },
  card: {
    width: 320,
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionValue: {
    fontSize: 14,
    marginTop: 5,
  },
  themeRow: {
    flexDirection: "row",
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOptionActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  themeOptionActiveLight: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    width: 320,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  backText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});