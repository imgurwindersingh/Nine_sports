# Nine Sports Backend

This repository publishes only the backend service, with the backend files available directly at the repository root.

## Included

- collection endpoints
- image upload handling
- delete collection and delete photo endpoints

## Run locally

```bash
npm install
npm run dev
```

The API runs on `http://localhost:4000`.

## Main endpoints

- `GET /api/health`
- `GET /api/collections`
- `GET /api/collections/:collectionId`
- `GET /api/photos`
- `POST /api/collections`
- `DELETE /api/collections/:collectionId`
- `DELETE /api/collections/:collectionId/photos/:photoId`

## Netlify

This repository now includes:

- `netlify/functions/api.js` to run Express as a Netlify Function
- `netlify.toml` for function routing
- `public/index.html` so the root URL does not show a 404 page

## Notes

- uploaded files are stored locally in `src/uploads/`
- collection data is stored locally by the backend
- on Netlify, this demo uses temporary storage in `/tmp`, so uploaded files are not durable across cold starts or deploys
- this is suitable for local testing first, not long-term production storage
