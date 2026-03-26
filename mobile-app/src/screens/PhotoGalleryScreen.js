import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { fetchCollectionById, fetchCollections } from "../api";
import { AppLogo } from "../components/AppLogo";
import { CollectionCard } from "../components/CollectionCard";
import { PhotoCard } from "../components/PhotoCard";
import { PhotoViewerModal } from "../components/PhotoViewerModal";
import { downloadPhotoToDevice } from "../utils/downloadPhoto";

function HeaderIconButton({ label, onPress }) {
  return (
    <Pressable style={styles.headerIconButton} onPress={onPress}>
      <Text style={styles.headerIconText}>{label}</Text>
    </Pressable>
  );
}

export function PhotoGalleryScreen() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadCollections(isRefresh = false) {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchCollections();
      setCollections(data);

      if (selectedCollection) {
        const updatedSelectedCollection = data.find((item) => item.id === selectedCollection.id);

        if (updatedSelectedCollection) {
          await openCollection(updatedSelectedCollection.id, false);
        }
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCollections();
  }, []);

  async function openCollection(collectionId, showLoader = true) {
    try {
      setError("");

      if (showLoader) {
        setLoading(true);
      }

      const detail = await fetchCollectionById(collectionId);
      setSelectedCollection(detail);
      setSelectedPhoto(null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  async function refreshSelectedCollection() {
    if (!selectedCollection) {
      return;
    }

    try {
      setRefreshing(true);
      await openCollection(selectedCollection.id, false);
    } finally {
      setRefreshing(false);
    }
  }

  function closeCollection() {
    setSelectedCollection(null);
    setSelectedPhoto(null);
  }

  async function handleDownload(photo) {
    try {
      setDownloadingPhotoId(photo.id);
      await downloadPhotoToDevice(photo);
    } catch (downloadError) {
      Alert.alert("Download failed", downloadError.message);
    } finally {
      setDownloadingPhotoId("");
    }
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#1f7aff" />
        <Text style={styles.helperText}>Loading collections...</Text>
      </View>
    );
  }

  const isCollectionOpen = Boolean(selectedCollection);
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredCollections = collections.filter((collection) =>
    collection.title.toLowerCase().includes(trimmedQuery)
  );

  function renderBrowseHeader() {
    return (
      <View style={styles.listHeaderWrap}>
        <View style={styles.searchRow}>
          <AppLogo compact />
          <View style={styles.searchBox}>
            <Text style={styles.searchBoxIcon}>⌕</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search event name"
              placeholderTextColor="#7d7d7d"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.screenTitle}>Collections</Text>
            <Text style={styles.screenSubtitle}>Browse event galleries</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{filteredCollections.length}</Text>
          </View>
        </View>
      </View>
    );
  }

  function renderCollectionHeader() {
    return (
      <View style={styles.listHeaderWrap}>
        <View style={styles.collectionHeaderCard}>
          <Pressable style={styles.backChip} onPress={closeCollection}>
            <Text style={styles.backChipArrow}>‹</Text>
            <Text style={styles.backChipText}>Collections</Text>
          </Pressable>

          <Text style={styles.collectionTitle}>{selectedCollection.title}</Text>
          <Text style={styles.collectionSubtitle}>
            {selectedCollection.photoCount} photo{selectedCollection.photoCount === 1 ? "" : "s"} in this gallery
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isCollectionOpen ? (
        <FlatList
          key={`photo-grid-${selectedCollection.id}`}
          data={selectedCollection.photos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={renderCollectionHeader}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <PhotoCard
                photo={item}
                onOpen={setSelectedPhoto}
                onDownload={handleDownload}
                isDownloading={downloadingPhotoId === item.id}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshSelectedCollection}
              tintColor="#1f7aff"
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyTitle}>No photos in this collection</Text>
              <Text style={styles.helperText}>Add photos from the admin side and refresh this page.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="collection-grid"
          data={filteredCollections}
          keyExtractor={(item) => item.id}
          numColumns={2}
          ListHeaderComponent={renderBrowseHeader}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <CollectionCard collection={item} onOpen={() => openCollection(item.id)} />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCollections(true)}
              tintColor="#1f7aff"
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyTitle}>
                {trimmedQuery ? "No matching events found" : "No collections created yet"}
              </Text>
              <Text style={styles.helperText}>
                {trimmedQuery
                  ? "Try another event name."
                  : "Create a collection from the admin web page and refresh this screen."}
              </Text>
            </View>
          }
        />
      )}

      <PhotoViewerModal
        photo={selectedPhoto}
        visible={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        onDownload={handleDownload}
        isDownloading={selectedPhoto?.id === downloadingPhotoId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#efefef",
    paddingTop: 10
  },
  listHeaderWrap: {
    paddingHorizontal: 14,
    paddingBottom: 12
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dddddd",
    borderRadius: 999,
    paddingHorizontal: 12
  },
  searchBoxIcon: {
    color: "#676767",
    fontSize: 16,
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    color: "#1b1b1b",
    fontSize: 14,
    paddingVertical: 12
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  headerIconText: {
    color: "#202020",
    fontSize: 18,
    fontWeight: "700"
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  screenTitle: {
    color: "#111111",
    fontSize: 22,
    fontWeight: "800"
  },
  screenSubtitle: {
    color: "#747474",
    fontSize: 12,
    marginTop: 2
  },
  countPill: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#1f7aff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8
  },
  countPillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800"
  },
  collectionHeaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  backChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#efefef",
    marginBottom: 12
  },
  backChipArrow: {
    fontSize: 18,
    color: "#111111",
    fontWeight: "900"
  },
  backChipText: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 13
  },
  collectionTitle: {
    color: "#111111",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    marginBottom: 6
  },
  collectionSubtitle: {
    color: "#747474",
    fontSize: 14
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 24
  },
  columnWrapper: {
    gap: 12
  },
  gridItem: {
    flex: 1
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    minHeight: 260
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 8,
    textAlign: "center"
  },
  helperText: {
    fontSize: 15,
    color: "#6f6f6f",
    marginTop: 10,
    textAlign: "center"
  },
  errorText: {
    color: "#b42318",
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 14
  }
});
