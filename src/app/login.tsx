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
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");

  // Watch for login (including Google redirect) and auto-navigate
  useEffect(() => {
    // Listen for auth events. INITIAL_SESSION fires once Supabase has
    // finished checking storage AND parsing any token from the URL
    // (this is what was racing with getSession() before, causing the
    // "have to click login twice" bug after Google redirect).
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AUTH STATE CHANGED:", event, session);
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        router.replace("/explore");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert("Email/Username aur Password bharo");
      return;
    }

    let loginEmail = identifier.trim();

    // If it doesn't look like an email, treat it as a username and look up the email
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

    console.log("LOGIN DATA:", data);
    console.log("LOGIN ERROR:", error);

    if (error) {
      alert(error.message);
    } else {
      alert("Login Successful");
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

    console.log("GOOGLE LOGIN DATA:", data);
    console.log("GOOGLE LOGIN ERROR:", error);

    if (error) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.logo}>SYBLUSH</Text>
        <Text style={styles.heading}>Login</Text>

        {/* Email or Username input */}
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          placeholderTextColor="#666"
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Login Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>

        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Create Account Link */}
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
    marginBottom: 10,
    letterSpacing: 4,
  },
  heading: {
    color: "#fff",
    fontSize: 22,
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
    marginTop: 4,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#222",
  },
  dividerText: {
    color: "#555",
    marginHorizontal: 12,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  googleIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  linkRow: {
    marginTop: 24,
    alignItems: "center",
  },
  linkBold: {
    color: "#fff",
    fontWeight: "bold",
  },
});
