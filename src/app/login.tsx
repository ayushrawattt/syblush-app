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
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function Login() {
  const { colors } = useTheme();
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
      alert("Please enter email/username and password");
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
        alert("Username not found. Please check and try again.");
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formContainer}>
        <Text style={[styles.logo, { color: colors.text }]}>SYBLUSH</Text>
        <Text style={[styles.heading, { color: colors.subtext }]}>Login</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Email or Username"
          placeholderTextColor={colors.subtextAlt}
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
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
          style={[styles.button, { backgroundColor: colors.text }]}
          onPress={handleLogin}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>Login</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.subtextAlt }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogleLogin}
        >
          <Text style={[styles.googleIcon, { color: colors.text }]}>G</Text>
          <Text style={[styles.googleButtonText, { color: colors.subtext }]}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup")} style={styles.linkRow}>
          <Text style={[styles.linkText, { color: colors.subtextAlt }]}>
            Don't have an account?{" "}
            <Text style={[styles.linkBold, { color: colors.subtext }]}>Create Account</Text>
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
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
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
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  googleIcon: {
    fontSize: 15,
    fontWeight: "bold",
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: "500",
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