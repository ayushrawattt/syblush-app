import { router } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNextStep = async () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    setLoading(true);
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase().trim())
      .single();
    setLoading(false);
    if (existing) {
      alert("This username is already taken. Please try another.");
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    setLoading(true);
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { username: cleanUsername } },
    });
    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ email: cleanEmail })
        .eq("id", data.user.id);
    }
    setLoading(false);
    alert("Account created successfully! Please login.");
    router.replace("/login");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formContainer}>
        <Text style={[styles.logo, { color: colors.text }]}>SYBLUSH</Text>

        {step === 1 ? (
          <>
            <Text style={[styles.heading, { color: colors.text }]}>Choose a Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Username"
              placeholderTextColor={colors.subtextAlt}
              autoCapitalize="none"
              autoFocus
              value={username}
              onChangeText={setUsername}
            />
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.text },
                loading && { backgroundColor: colors.subtextAlt },
              ]}
              onPress={handleNextStep}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {loading ? "Checking..." : "Next →"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.heading, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subheading, { color: colors.subtext }]}>@{username}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Email"
              placeholderTextColor={colors.subtextAlt}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Password"
              placeholderTextColor={colors.subtextAlt}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.text },
                loading && { backgroundColor: colors.subtextAlt },
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {loading ? "Creating..." : "Create Account"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backRow}>
              <Text style={[styles.backText, { color: colors.subtextAlt }]}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => router.push("/login")}
          style={styles.linkRow}
        >
          <Text style={[styles.linkText, { color: colors.subtextAlt }]}>
            Already have an account?{" "}
            <Text style={[styles.linkBold, { color: colors.subtext }]}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 340,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 4,
  },
  heading: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  subheading: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  button: {
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  backRow: {
    marginTop: 14,
    alignItems: "center",
  },
  backText: {
    fontSize: 13,
  },
  linkRow: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 12,
  },
  linkBold: {
    fontWeight: "600",
  },
});