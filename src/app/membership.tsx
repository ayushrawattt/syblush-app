import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function Membership() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Premium Membership</Text>

        <Text style={[styles.desc, { color: colors.subtext }]}>
          Access premium gyms across the country with one membership.
        </Text>

        <Text style={[styles.price, { color: colors.text }]}>₹1299</Text>

        <Text style={[styles.month, { color: colors.subtext }]}>per month</Text>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]}>
          <Text style={[styles.buttonText, { color: colors.background }]}>Join Premium</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },

  card: {
    borderRadius: 20,
    padding: 15,
    width: 340,
    alignSelf: "center",
    borderWidth: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  desc: {
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
  },

  price: {
    fontSize: 34,
    fontWeight: "bold",
  },

  month: {
    fontSize: 16,
    marginBottom: 25,
  },

  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});