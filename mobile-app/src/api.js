import { API_BASE_URL } from "./config";

export async function fetchCollections() {
  const response = await fetch(`${API_BASE_URL}/api/collections`);

  if (!response.ok) {
    throw new Error("Failed to load collections from server.");
  }

  return response.json();
}

export async function fetchCollectionById(collectionId) {
  const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`);

  if (!response.ok) {
    throw new Error("Failed to load collection from server.");
  }

  return response.json();
}
