import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { PhotoGalleryScreen } from "./src/screens/PhotoGalleryScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <PhotoGalleryScreen />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f1e8"
  },
  container: {
    flex: 1
  }
});
