import { getStore } from "@netlify/blobs";

const FUNCTION_PREFIX = "/.netlify/functions/api";
const COLLECTION_PREFIX = "collections/";
const uploadsStore = getStore({ name: "uploads", consistency: "strong" });
const collectionsStore = getStore({ name: "collections", consistency: "strong" });

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

function getRequestPath(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith(FUNCTION_PREFIX)) {
    return url.pathname.slice(FUNCTION_PREFIX.length) || "/";
  }

  return url.pathname;
}

function getBaseUrl(request) {
  const url = new URL(request.url);
  return url.origin;
}

function buildImageUrl(request, imageKey) {
  return `${getBaseUrl(request)}/uploads/${encodeURIComponent(imageKey)}`;
}

function formatPhoto(request, photo) {
  return {
    ...photo,
    imageUrl: buildImageUrl(request, photo.imageKey)
  };
}

function formatCollectionSummary(request, collection) {
  const photos = collection.photos || [];

  return {
    id: collection.id,
    title: collection.title,
    createdAt: collection.createdAt,
    photoCount: photos.length,
    coverImageUrl: photos[0] ? buildImageUrl(request, photos[0].imageKey) : "",
    previewImages: photos.slice(0, 4).map((photo) => formatPhoto(request, photo))
  };
}

function formatCollectionDetail(request, collection) {
  return {
    ...formatCollectionSummary(request, collection),
    photos: (collection.photos || []).map((photo) => formatPhoto(request, photo))
  };
}

async function listCollections() {
  const { blobs } = await collectionsStore.list({ prefix: COLLECTION_PREFIX });
  const collections = await Promise.all(
    blobs.map((blob) => collectionsStore.get(blob.key, { type: "json" }))
  );

  return collections.filter(Boolean);
}

async function getCollectionById(collectionId) {
  return collectionsStore.get(`${COLLECTION_PREFIX}${collectionId}.json`, { type: "json" });
}

async function saveCollection(collection) {
  await collectionsStore.setJSON(`${COLLECTION_PREFIX}${collection.id}.json`, collection);
}

async function deleteCollectionRecord(collectionId) {
  await collectionsStore.delete(`${COLLECTION_PREFIX}${collectionId}.json`);
}

async function readUploadedFile(imageKey) {
  return uploadsStore.getWithMetadata(imageKey, { type: "stream" });
}

async function saveUploadedFile(file) {
  const imageKey = `${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/\s+/g, "-")}`;

  await uploadsStore.set(imageKey, file, {
    metadata: {
      contentType: file.type || "application/octet-stream",
      originalName: file.name
    }
  });

  return imageKey;
}

async function deleteUploadedFile(imageKey) {
  if (!imageKey) {
    return;
  }

  await uploadsStore.delete(imageKey);
}

async function handleCollectionsGet(request) {
  const collections = await listCollections();

  return json(
    collections
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((collection) => formatCollectionSummary(request, collection))
  );
}

async function handleCollectionDetailGet(request, collectionId) {
  const collection = await getCollectionById(collectionId);

  if (!collection) {
    return json({ message: "Collection not found." }, { status: 404 });
  }

  return json(formatCollectionDetail(request, collection));
}

async function handlePhotosGet(request) {
  const collections = await listCollections();
  const photos = collections
    .flatMap((collection) =>
      (collection.photos || []).map((photo) => ({
        ...formatPhoto(request, photo),
        collectionId: collection.id,
        collectionTitle: collection.title
      }))
    )
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  return json(photos);
}

async function handleCollectionCreate(request) {
  const form = await request.formData();
  const collectionTitle = String(form.get("collectionTitle") || "").trim();

  if (!collectionTitle) {
    return json({ message: "Collection title is required." }, { status: 400 });
  }

  const titlePrefix = String(form.get("titlePrefix") || "").trim();
  const uploadCandidates = [...form.getAll("images"), form.get("image")].filter(Boolean);
  const files = uploadCandidates.filter((item) => typeof item === "object" && typeof item.arrayBuffer === "function");

  if (!files.length) {
    return json({ message: "At least one image file is required." }, { status: 400 });
  }

  if (files.length > 1000) {
    return json({ message: "You can upload up to 1000 images at one time." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const collectionId = `collection-${Date.now()}`;
  const photos = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const originalName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    const title = titlePrefix
      ? `${titlePrefix} ${index + 1}`
      : originalName || `Photo ${index + 1}`;
    const imageKey = await saveUploadedFile(file);

    photos.push({
      id: `${collectionId}-photo-${index}`,
      title,
      imageKey,
      uploadedAt: createdAt,
      contentType: file.type || "application/octet-stream",
      originalName: file.name
    });
  }

  const collection = {
    id: collectionId,
    title: collectionTitle,
    createdAt,
    photos
  };

  await saveCollection(collection);
  return json(formatCollectionDetail(request, collection), { status: 201 });
}

async function handleCollectionDelete(collectionId) {
  const collection = await getCollectionById(collectionId);

  if (!collection) {
    return json({ message: "Collection not found." }, { status: 404 });
  }

  for (const photo of collection.photos || []) {
    await deleteUploadedFile(photo.imageKey);
  }

  await deleteCollectionRecord(collectionId);
  return json({ message: "Collection deleted successfully." });
}

async function handlePhotoDelete(collectionId, photoId) {
  const collection = await getCollectionById(collectionId);

  if (!collection) {
    return json({ message: "Collection not found." }, { status: 404 });
  }

  const photoIndex = (collection.photos || []).findIndex((photo) => photo.id === photoId);

  if (photoIndex === -1) {
    return json({ message: "Photo not found." }, { status: 404 });
  }

  const [removedPhoto] = collection.photos.splice(photoIndex, 1);
  await deleteUploadedFile(removedPhoto.imageKey);
  await saveCollection(collection);

  return json({ message: "Photo deleted successfully." });
}

async function handleUploadAsset(request, imageKey) {
  const file = await readUploadedFile(imageKey);

  if (!file?.data) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.data, {
    headers: {
      "content-type": file.metadata?.contentType || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}

export default async function handler(request) {
  try {
    const path = getRequestPath(request);
    const method = request.method.toUpperCase();

    if (path === "/" && method === "GET") {
      return json({
        ok: true,
        name: "Nine Sports Netlify API"
      });
    }

    if (path === "/api/health" && method === "GET") {
      return json({ ok: true });
    }

    if (path === "/api/collections" && method === "GET") {
      return handleCollectionsGet(request);
    }

    if (path === "/api/photos" && method === "GET") {
      return handlePhotosGet(request);
    }

    if (path === "/api/collections" && method === "POST") {
      return handleCollectionCreate(request);
    }

    const collectionDetailMatch = path.match(/^\/api\/collections\/([^/]+)$/);

    if (collectionDetailMatch && method === "GET") {
      return handleCollectionDetailGet(request, collectionDetailMatch[1]);
    }

    if (collectionDetailMatch && method === "DELETE") {
      return handleCollectionDelete(collectionDetailMatch[1]);
    }

    const photoDeleteMatch = path.match(/^\/api\/collections\/([^/]+)\/photos\/([^/]+)$/);

    if (photoDeleteMatch && method === "DELETE") {
      return handlePhotoDelete(photoDeleteMatch[1], photoDeleteMatch[2]);
    }

    const uploadMatch = path.match(/^\/uploads\/(.+)$/);

    if (uploadMatch && method === "GET") {
      return handleUploadAsset(request, decodeURIComponent(uploadMatch[1]));
    }

    return json({ message: "Not found." }, { status: 404 });
  } catch (error) {
    console.error(error);
    return json({ message: "Request failed." }, { status: 500 });
  }
}
