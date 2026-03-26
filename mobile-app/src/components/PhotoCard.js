import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

export function PhotoCard({ photo, onOpen, onDownload, isDownloading }) {
  return (
    <View style={styles.card}>
      <Pressable onPress={() => onOpen(photo)}>
        <Image source={{ uri: photo.imageUrl }} style={styles.image} />
      </Pressable>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>
          {photo.title}
        </Text>
        <Text style={styles.date}>
          {new Date(photo.uploadedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
          })}
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => onOpen(photo)}>
            <Text style={styles.primaryButtonText}>View</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, isDownloading && styles.disabledButton]}
            onPress={() => onDownload(photo)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#1f1a15" size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>Save</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fffaf4",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#28180d",
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 5
  },
  image: {
    width: "100%",
    height: 172,
    backgroundColor: "#eadcca"
  },
  meta: {
    padding: 12
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "800",
    color: "#1f1a15",
    marginBottom: 4
  },
  date: {
    fontSize: 12,
    color: "#7b6a5d",
    fontWeight: "600"
  },
  primaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#aa4b1d",
    paddingVertical: 10,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#f1dfcf",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#1f1a15",
    fontWeight: "800",
    fontSize: 12
  },
  disabledButton: {
    opacity: 0.7
  }
});
