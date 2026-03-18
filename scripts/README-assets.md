# Cloudinary assets → local `public/assets`

All Cloudinary image URLs used in the app are downloaded into `public/assets` and the codebase is updated to use local paths (`/assets/...`).

## One-time / update

```bash
npm run download-assets
```

- Downloads every URL listed in `scripts/download-cloudinary-assets.mjs` to `public/assets/`.
- Writes `lib/constants/cloudinary-asset-paths.json` (URL → `/assets/filename`).
- Replaces those URLs in `app/`, `components/`, `features/`, `utils/`, and `lib/` with the local paths.

## Adding new Cloudinary URLs

1. Open `scripts/download-cloudinary-assets.mjs`.
2. Add the full URL(s) to the `CLOUDINARY_URLS` array.
3. Run `npm run download-assets` again.

Filenames are taken from the last path segment (e.g. `image_7_jijlik.png`). The replace step only touches files under the directories listed in the script.

## Note

- `next.config.ts` still allows `res.cloudinary.com` as an image hostname so any remaining or dynamic Cloudinary URLs (e.g. from APIs) keep working.
- Commented-out URLs in source are not replaced.
