import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

type SearchResult = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
};

export default function Search() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .or(`username.ilike.%${text.trim()}%,full_name.ilike.%${text.trim()}%`)
      .limit(20);
    if (error) {
      console.log("Search error:", error.message);
      setResults([]);
    } else {
      setResults(data ?? []);
    }
    setLoading(false);
  }, []);

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/user-profile?id=${item.id}` as any)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.avatarText, { color: colors.text }]}>
            {item.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>
        <Text style={[styles.username, { color: colors.subtextAlt }]}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search"
          placeholderTextColor={colors.subtextAlt}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>
      {loading && <ActivityIndicator color={colors.text} style={{ marginTop: 20 }} />}
      {!loading && query.trim() !== "" && results.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.subtextAlt }]}>No users found.</Text>
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
});