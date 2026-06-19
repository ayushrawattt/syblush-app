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
      options: {
        data: {
          username: cleanUsername,
        },
      },
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
              placeholderTextColor="#666"
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
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
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
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 380,
  },
  logo: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 4,
  },
  heading: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  subheading: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  button: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#444",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  backRow: {
    marginTop: 16,
    alignItems: "center",
  },
  backText: {
    color: "#666",
    fontSize: 14,
  },
  linkRow: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: "#666",
    fontSize: 14,
  },
  linkBold: {
    color: "#fff",
    fontWeight: "bold",
  },
});