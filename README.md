
# MK Jewel Store — Local Images + Uploads

- All site images live in `/public/images` or `/uploads`.
- Product creation accepts image file. If API is available, file is saved to `/uploads` and path stored. Without API, image is embedded as a data URL in localStorage.
- Admin-only product CRUD. Demo admin shown on login.

## Dev
npm i
npm run dev

## Build + Serve
npm run build
npm run start  # serves dist and handles /api and /uploads

## Deploy on Render
render.yaml included.
