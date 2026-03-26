import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;
const uploadsDir = path.join(__dirname, "uploads");
const collectionsFile = path.join(__dirname, "collections.json");
const legacyPhotosFile = path.join(__dirname, "images.json");

fs.mkdirSync(uploadsDir, { recursive: true });

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function ensureDatabase() {
  if (fs.existsSync(collectionsFile)) {
    const existingCollections = readJsonFile(collectionsFile);

    if (existingCollections.length || !fs.existsSync(legacyPhotosFile)) {
      return;
    }

    const legacyPhotos = readJsonFile(legacyPhotosFile);

    if (legacyPhotos.length) {
      writeJsonFile(collectionsFile, [
        {
          id: `legacy-${Date.now()}`,
          title: "Imported Collection",
          createdAt: new Date().toISOString(),
          photos: legacyPhotos
        }
      ]);
    }

    return;
  }

  const legacyPhotos = readJsonFile(legacyPhotosFile);

  if (legacyPhotos.length) {
    writeJsonFile(collectionsFile, [
      {
        id: `legacy-${Date.now()}`,
        title: "Imported Collection",
        createdAt: new Date().toISOString(),
        photos: legacyPhotos
      }
    ]);
    return;
  }

  writeJsonFile(collectionsFile, []);
}

ensureDatabase();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 1000
  }
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

function readCollections() {
  return readJsonFile(collectionsFile);
}

function writeCollections(collections) {
  writeJsonFile(collectionsFile, collections);
}

function deleteUploadedFile(filename) {
  if (!filename) {
    return;
  }

  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function getPublicBaseUrl(req) {
  return process.env.PUBLIC_SERVER_URL || `${req.protocol}://${req.get("host")}`;
}

function formatPhoto(photo, baseUrl) {
  return {
    ...photo,
    imageUrl: `${baseUrl}/uploads/${photo.filename}`
  };
}

function formatCollectionSummary(collection, baseUrl) {
  const photos = collection.photos || [];

  return {
    id: collection.id,
    title: collection.title,
    createdAt: collection.createdAt,
    photoCount: photos.length,
    coverImageUrl: photos[0] ? `${baseUrl}/uploads/${photos[0].filename}` : "",
    previewImages: photos.slice(0, 4).map((photo) => formatPhoto(photo, baseUrl))
  };
}

function formatCollectionDetail(collection, baseUrl) {
  return {
    ...formatCollectionSummary(collection, baseUrl),
    photos: (collection.photos || []).map((photo) => formatPhoto(photo, baseUrl))
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/collections", (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const collections = readCollections()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((collection) => formatCollectionSummary(collection, baseUrl));

  res.json(collections);
});

app.get("/api/collections/:collectionId", (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const collections = readCollections();
  const collection = collections.find((item) => item.id === req.params.collectionId);

  if (!collection) {
    return res.status(404).json({ message: "Collection not found." });
  }

  return res.json(formatCollectionDetail(collection, baseUrl));
});

app.get("/api/photos", (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const photos = readCollections()
    .flatMap((collection) =>
      (collection.photos || []).map((photo) => ({
        ...formatPhoto(photo, baseUrl),
        collectionId: collection.id,
        collectionTitle: collection.title
      }))
    )
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  res.json(photos);
});

app.post(
  "/api/collections",
  upload.fields([
    { name: "images", maxCount: 1000 },
    { name: "image", maxCount: 1 }
  ]),
  (req, res) => {
    const collectionTitle = (req.body.collectionTitle || "").trim();

    if (!collectionTitle) {
      return res.status(400).json({ message: "Collection title is required." });
    }

    const uploadedFiles = [
      ...(req.files?.images || []),
      ...(req.files?.image || [])
    ];

    if (!uploadedFiles.length) {
      return res.status(400).json({ message: "At least one image file is required." });
    }

    const titlePrefix = (req.body.titlePrefix || "").trim();
    const createdAt = new Date().toISOString();
    const collectionId = `collection-${Date.now()}`;

    const photos = uploadedFiles.map((file, index) => {
      const originalName = path.parse(file.originalname).name.replace(/[-_]+/g, " ").trim();
      const title = titlePrefix
        ? `${titlePrefix} ${index + 1}`
        : originalName || `Photo ${index + 1}`;

      return {
        id: `${collectionId}-photo-${index}`,
        title,
        filename: file.filename,
        uploadedAt: createdAt
      };
    });

    const collections = readCollections();
    const newCollection = {
      id: collectionId,
      title: collectionTitle,
      createdAt,
      photos
    };

    collections.push(newCollection);
    writeCollections(collections);

    const baseUrl = getPublicBaseUrl(req);
    return res.status(201).json(formatCollectionDetail(newCollection, baseUrl));
  }
);

app.delete("/api/collections/:collectionId", (req, res) => {
  const collections = readCollections();
  const collectionIndex = collections.findIndex((item) => item.id === req.params.collectionId);

  if (collectionIndex === -1) {
    return res.status(404).json({ message: "Collection not found." });
  }

  const [removedCollection] = collections.splice(collectionIndex, 1);

  for (const photo of removedCollection.photos || []) {
    deleteUploadedFile(photo.filename);
  }

  writeCollections(collections);
  return res.json({ message: "Collection deleted successfully." });
});

app.delete("/api/collections/:collectionId/photos/:photoId", (req, res) => {
  const collections = readCollections();
  const collection = collections.find((item) => item.id === req.params.collectionId);

  if (!collection) {
    return res.status(404).json({ message: "Collection not found." });
  }

  const photoIndex = (collection.photos || []).findIndex((photo) => photo.id === req.params.photoId);

  if (photoIndex === -1) {
    return res.status(404).json({ message: "Photo not found." });
  }

  const [removedPhoto] = collection.photos.splice(photoIndex, 1);
  deleteUploadedFile(removedPhoto.filename);
  writeCollections(collections);

  return res.json({ message: "Photo deleted successfully." });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ message: "You can upload up to 1000 images at one time." });
  }

  return res.status(500).json({ message: "Request failed." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
