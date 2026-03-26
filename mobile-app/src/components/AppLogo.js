import { Image, StyleSheet, Text, View } from "react-native";

const logoImage = require("../../assets/nine-sports-logo.jpg");

export function AppLogo({ compact = false }) {
  return (
    <View style={[styles.logoFrame, compact && styles.logoFrameCompact]}>
      <Image source={logoImage} style={styles.logoImage} resizeMode='contain' />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  logoFrame: {
    width: 120,
    height: 60,
  },
  logoFrameCompact: {
    width: 88,
    height: 34
  },
  logoImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff"
  },
  wordmark: {
    gap: 2
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1c1713",
    letterSpacing: -0.6
  },
  caption: {
    fontSize: 12,
    color: "#7a695d",
    fontWeight: "600"
  }
});
