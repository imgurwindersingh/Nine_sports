import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";

export function PhotoViewerModal({
  photo,
  visible,
  onClose,
  onDownload,
  isDownloading
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
          <Pressable
            style={[styles.downloadButton, isDownloading && styles.disabledButton]}
            onPress={() => photo && onDownload(photo)}
            disabled={!photo || isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#101010" size="small" />
            ) : (
              <Text style={styles.downloadButtonText}>Download</Text>
            )}
          </Pressable>
        </View>

        {photo ? (
          <View style={styles.content}>
            <Image source={{ uri: photo.imageUrl }} style={styles.image} resizeMode="contain" />
            <View style={styles.captionWrap}>
              <Text style={styles.title}>{photo.title}</Text>
              <Text style={styles.subtitle}>Tap download to save this photo to the device.</Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#120d09"
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8
  },
  closeButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#2b2118"
  },
  closeButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  downloadButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#efe3d4",
    minWidth: 108,
    alignItems: "center"
  },
  downloadButtonText: {
    color: "#101010",
    fontWeight: "700"
  },
  disabledButton: {
    opacity: 0.7
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 20
  },
  image: {
    flex: 1,
    width: "100%"
  },
  captionWrap: {
    paddingHorizontal: 12,
    paddingTop: 18
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6
  },
  subtitle: {
    color: "#ceb8a5",
    fontSize: 15,
    lineHeight: 21
  }
});
