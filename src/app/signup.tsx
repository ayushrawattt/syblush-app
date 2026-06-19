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
import { supabase } from "../lib/supabase";

export default function Signup() {
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
    alert("Account created! Please login.");
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.logo}>SYBLUSH</Text>

        {step === 1 ? (
          <>
            <Text style={styles.heading}>Choose a Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#444"
              autoCapitalize="none"
              autoFocus
              value={username}
              onChangeText={setUsername}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleNextStep}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Checking..." : "Next →"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.subheading}>@{username}</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#444"
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#444"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating..." : "Create Account"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backRow}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => router.push("/login")}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>
            Already have an account?{" "}
            <Text style={styles.linkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 340,
  },
  logo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 4,
  },
  heading: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  subheading: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#0d0d0d",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  button: {
    backgroundColor: "#fff",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#444",
  },
  buttonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  backRow: {
    marginTop: 14,
    alignItems: "center",
  },
  backText: {
    color: "#444",
    fontSize: 13,
  },
  linkRow: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#444",
    fontSize: 12,
  },
  linkBold: {
    color: "#888",
    fontWeight: "600",
  },
});