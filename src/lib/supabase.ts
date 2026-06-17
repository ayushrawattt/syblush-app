import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = "https://wekcyqtvnlgojcjtazow.supabase.co";
const supabaseAnonKey = "sb_publishable_iQtyoBOSbH9vy7bbCTNwGw_SMmqp772";

const getStorage = () => {
  if (typeof window === "undefined") return undefined;
  if (Platform.OS === "web") {
    return localStorage;
  }
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
