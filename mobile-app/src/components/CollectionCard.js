import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export function CollectionCard({ collection, onOpen }) {
  return (
    <Pressable style={styles.card} onPress={() => onOpen(collection)}>
      <View style={styles.imageWrap}>
        {collection.coverImageUrl ? (
          <Image source={{ uri: collection.coverImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>
          {collection.title}
        </Text>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.caption}>
              {collection.photoCount} photo{collection.photoCount === 1 ? "" : "s"}
            </Text>
            <Text style={styles.date}>
              {new Date(collection.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
              })}
            </Text>
          </View>

          <View style={styles.actionBubble}>
            <Text style={styles.actionText}>More</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  imageWrap: {
    backgroundColor: "#f6f6f6",
    padding: 10
  },
  image: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    backgroundColor: "#ededed"
  },
  placeholder: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    backgroundColor: "#ededed",
    alignItems: "center",
    justifyContent: "center"
  },
  placeholderText: {
    color: "#8b8b8b",
    fontSize: 12,
    fontWeight: "600"
  },
  meta: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12
  },
  title: {
    color: "#111111",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    marginBottom: 10
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8
  },
  caption: {
    color: "#4d4d4d",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2
  },
  date: {
    color: "#8a8a8a",
    fontSize: 11
  },
  actionBubble: {
    borderRadius: 999,
    backgroundColor: "#1f7aff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  actionText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "800"
  }
});
