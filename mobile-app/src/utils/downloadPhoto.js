import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

export async function downloadPhotoToDevice(photo) {
  const permission = await MediaLibrary.requestPermissionsAsync(true);

  if (!permission.granted) {
    throw new Error("Photo library permission is required to save images.");
  }

  const downloadDirectory = `${FileSystem.cacheDirectory}downloads/`;
  const directoryInfo = await FileSystem.getInfoAsync(downloadDirectory);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(downloadDirectory, { intermediates: true });
  }

  const safeName = photo.filename || `${photo.id}.jpg`;
  const fileUri = `${downloadDirectory}${safeName}`;
  const result = await FileSystem.downloadAsync(photo.imageUrl, fileUri);

  await MediaLibrary.saveToLibraryAsync(result.uri);

  Alert.alert("Download complete", `${photo.title} was saved to your device photos.`);
}
