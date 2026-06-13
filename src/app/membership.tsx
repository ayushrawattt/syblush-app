import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Membership() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Premium Membership</Text>

        <Text style={styles.desc}>
          Access premium gyms across the country with one membership.
        </Text>

        <Text style={styles.price}>₹1299</Text>

        <Text style={styles.month}>per month</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Join Premium</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 100,
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 15,
    width: 340,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#222",
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  desc: {
    color: "#999",
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
  },

  price: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
  },

  month: {
    color: "#aaa",
    fontSize: 16,
    marginBottom: 25,
  },

  button: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
