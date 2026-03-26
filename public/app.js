const API_BASE_URL = (() => {
  if (window.location.protocol === "file:") {
    return "http://localhost:4000";
  }

  if (window.location.hostname === "localhost" && window.location.port && window.location.port !== "4000") {
    return "http://localhost:4000";
  }

  return window.location.origin;
})();

const uploadForm = document.getElementById("upload-form");
const collectionTitleInput = document.getElementById("collection-title");
const titlePrefixInput = document.getElementById("title-prefix");
const imageInput = document.getElementById("image");
const statusText = document.getElementById("status");
const collectionList = document.getElementById("collection-list");
const refreshButton = document.getElementById("refresh-button");
const selectionCount = document.getElementById("selection-count");
let collectionsCache = [];
let expandedCollectionId = "";
const collectionDetailsCache = {};

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b42318" : "#675c50";
}

async function getErrorMessage(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const errorData = await response.json();
      return errorData.message || fallbackMessage;
    }

    const text = await response.text();
    return text || fallbackMessage;
  } catch (_error) {
    return fallbackMessage;
  }
}

function renderCollections(collections) {
  if (!collections.length) {
    collectionList.innerHTML = "<p>No collections created yet.</p>";
    return;
  }

  collectionList.innerHTML = collections
    .map(
      (collection) => `
        <article class="collection-item">
          <img src="${collection.coverImageUrl || ""}" alt="${collection.title}" />
          <div class="collection-meta">
            <h3>${collection.title}</h3>
            <p>${new Date(collection.createdAt).toLocaleString()}</p>
            <span class="collection-count">${collection.photoCount} photo${collection.photoCount === 1 ? "" : "s"}</span>
            <div class="collection-actions">
              <button
                type="button"
                class="secondary-button action-button"
                data-action="toggle-photos"
                data-collection-id="${collection.id}"
              >
                ${expandedCollectionId === collection.id ? "Hide Photos" : "Manage Photos"}
              </button>
              <button
                type="button"
                class="danger-button action-button"
                data-action="delete-collection"
                data-collection-id="${collection.id}"
              >
                Delete Collection
              </button>
            </div>
            ${
              expandedCollectionId === collection.id
                ? renderCollectionPhotos(collection.id)
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");
}

function renderCollectionPhotos(collectionId) {
  const detail = collectionDetailsCache[collectionId];

  if (!detail) {
    return '<p class="photo-manage-message">Loading collection photos...</p>';
  }

  if (!detail.photos.length) {
    return '<p class="photo-manage-message">No photos left in this collection.</p>';
  }

  return `
    <div class="photo-manage-grid">
      ${detail.photos
        .map(
          (photo) => `
            <article class="manage-photo-card">
              <img src="${photo.imageUrl}" alt="${photo.title}" />
              <div class="manage-photo-meta">
                <h4>${photo.title}</h4>
                <button
                  type="button"
                  class="danger-button action-button full-width-button"
                  data-action="delete-photo"
                  data-collection-id="${collectionId}"
                  data-photo-id="${photo.id}"
                >
                  Delete Photo
                </button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

async function loadCollections() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Could not load collections."));
    }

    const collections = await response.json();
    collectionsCache = collections;

    if (expandedCollectionId && !collections.some((collection) => collection.id === expandedCollectionId)) {
      expandedCollectionId = "";
    }

    renderCollections(collections);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadCollectionDetail(collectionId) {
  const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Could not load collection details."));
  }

  const detail = await response.json();
  collectionDetailsCache[collectionId] = detail;
  return detail;
}

function updateSelectionCount() {
  const count = imageInput.files.length;
  selectionCount.textContent =
    count > 0 ? `${count} image${count === 1 ? "" : "s"} selected.` : "No images selected.";
}

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!collectionTitleInput.value.trim()) {
    setStatus("Please enter a collection title.", true);
    return;
  }

  if (!imageInput.files.length) {
    setStatus("Please choose at least one image first.", true);
    return;
  }

  const selectedCount = imageInput.files.length;
  const formData = new FormData();
  formData.append("collectionTitle", collectionTitleInput.value);
  formData.append("titlePrefix", titlePrefixInput.value);

  for (const file of imageInput.files) {
    formData.append("images", file);
  }

  try {
    setStatus(`Creating collection with ${selectedCount} photo(s)...`);

    const response = await fetch(`${API_BASE_URL}/api/collections`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Upload failed."));
    }

    uploadForm.reset();
    updateSelectionCount();
    setStatus(`Collection created with ${selectedCount} photo(s).`);
    await loadCollections();
  } catch (error) {
    setStatus(error.message, true);
  }
});

imageInput.addEventListener("change", updateSelectionCount);

refreshButton.addEventListener("click", loadCollections);

collectionList.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const collectionId = actionButton.dataset.collectionId;
  const photoId = actionButton.dataset.photoId;

  try {
    if (action === "toggle-photos") {
      if (expandedCollectionId === collectionId) {
        expandedCollectionId = "";
        renderCollections(collectionsCache);
        return;
      }

      expandedCollectionId = collectionId;
      renderCollections(collectionsCache);
      await loadCollectionDetail(collectionId);
      renderCollections(collectionsCache);
      return;
    }

    if (action === "delete-collection") {
      const shouldDeleteCollection = window.confirm("Delete this full collection?");

      if (!shouldDeleteCollection) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Could not delete collection."));
      }

      delete collectionDetailsCache[collectionId];
      if (expandedCollectionId === collectionId) {
        expandedCollectionId = "";
      }

      setStatus("Collection deleted successfully.");
      await loadCollections();
      return;
    }

    if (action === "delete-photo") {
      const shouldDeletePhoto = window.confirm("Delete this photo from the collection?");

      if (!shouldDeletePhoto) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/photos/${photoId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Could not delete photo."));
      }

      setStatus("Photo deleted successfully.");
      await loadCollectionDetail(collectionId);
      await loadCollections();
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

updateSelectionCount();
loadCollections();
