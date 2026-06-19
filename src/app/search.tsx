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
import { supabase } from "../lib/supabase";

type SearchResult = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
};

export default function Search() {
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
      style={styles.row}
      onPress={() => router.push(`/user-profile?id=${item.id}` as any)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search by name or username"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>
      {loading && <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />}
      {!loading && query.trim() !== "" && results.length === 0 && (
        <Text style={styles.emptyText}>No users found.</Text>
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
    backgroundColor: "#000",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
    fontSize: 14,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
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
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  username: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
});