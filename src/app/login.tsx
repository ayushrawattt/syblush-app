import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        router.replace("/explore");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert("Email/Username aur Password bharo");
      return;
    }

    let loginEmail = identifier.trim();

    if (!loginEmail.includes("@")) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", loginEmail.toLowerCase())
        .single();

      if (profileError || !profile) {
        alert("Username nahi mila. Please check karo.");
        return;
      }
      loginEmail = profile.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.replace("/explore");
    }
  };

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:8081/login",
      },
    });
    if (error) alert(error.message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>

        <Text style={styles.logo}>SYBLUSH</Text>
        <Text style={styles.heading}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          placeholderTextColor="#444"
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#444"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup")} style={styles.linkRow}>
          <Text style={styles.linkText}>
            Don't have an account?{" "}
            <Text style={styles.linkBold}>Create Account</Text>
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
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
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
  buttonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1a1a1a",
  },
  dividerText: {
    color: "#444",
    marginHorizontal: 10,
    fontSize: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d0d",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  googleIcon: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginRight: 8,
  },
  googleButtonText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "500",
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