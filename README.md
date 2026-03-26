# Admin Upload to Mobile Gallery

This project shows a collection-based architecture for your requirement:

- Admin creates collections from a web page
- Backend stores collection data and image files
- Mobile app fetches the collection list
- Users open a collection and see its photos inside the app
- Users can open photos in full view and download them on the device

## Project structure

```text
new project/
  backend/        -> Node.js API for collections + photo storage
  admin-web/      -> One-page admin website for creating collections
  mobile-app/     -> React Native app for browsing collections
```

## How it works

1. Admin opens the web page in `admin-web/`
2. Admin enters a collection title
3. Admin selects one or many images and clicks create
4. Backend saves files in `backend/src/uploads/`
5. Backend saves collection metadata in `backend/src/collections.json`
6. Mobile app calls `GET /api/collections`
7. Mobile app shows collection cards
8. User opens a collection and sees its photos

## API flow

### Create collection

`POST /api/collections`

Form fields:

- `collectionTitle`: required collection/folder title
- `titlePrefix`: optional photo title prefix
- `images`: one or many image files

You can upload up to `1000` images in one request.

### Get all collections

`GET /api/collections`

Returns an array like:

```json
[
  {
    "id": "collection-1711457823456",
    "title": "Summer Trip",
    "createdAt": "2026-03-26T05:01:00.000Z",
    "photoCount": 150,
    "coverImageUrl": "http://192.168.1.10:4000/uploads/1711457823456-cover.jpg"
  }
]
```

## Run the backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:4000`.

## Run the admin panel

You can open the file directly in a browser:

- `admin-web/index.html`

Or serve it with any static server if you want.

The admin page uploads to `http://localhost:4000`.

## Run the mobile app

```bash
cd mobile-app
npm install
npm start
```

Important:

- A real device cannot use `localhost` for your computer's backend
- In `mobile-app/src/config.js`, change the server URL to your computer's local IP
- Example: `http://192.168.1.10:4000`

Your phone and computer must be on the same Wi-Fi network.

## Production-ready note

For real production, you should usually use:

- Cloud storage: AWS S3, Cloudinary, Firebase Storage
- Database: PostgreSQL, MongoDB, Firebase Firestore
- Authentication for admin uploads
- CDN for faster image delivery

This starter uses local storage so the full flow is easy to understand first.
