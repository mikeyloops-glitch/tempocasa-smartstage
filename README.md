# TEMPOCASA SMARTSTAGE

TEMPOCASA SMARTSTAGE is a branded pilot duplicate of the AI virtual staging platform. It keeps the same working camera upload, mobile web, before/after preview, media library, Cloudinary storage, and OpenAI image editing pipeline, with Tempocasa-facing branding.

## What Is Included

- Next.js 15 app router with React, TypeScript, Tailwind CSS, and Framer Motion
- Tempocasa branded landing page, login screen, and dashboard
- Drag-and-drop image upload for JPG, PNG, and WEBP
- iPhone and Android camera capture through the mobile browser upload flow
- AI staging controls for room type, style, staging level, empty-room generation, and custom prompt notes
- Geometry-preserving prompt engine with negative prompt safeguards
- OpenAI image editing API route with optional mask support
- Cloudinary upload helper for original and generated renders
- Before/after slider, fullscreen preview, recent project history, media library, and download panel
- Vercel-ready configuration and environment template

## Local Setup

```bash
cd tempocasa-smartstage
npm install
npm run dev
```

Open `http://localhost:3000`.

For phone testing on the same Wi-Fi, run:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

Then open `http://YOUR_PC_LOCAL_IP:3000` on the phone. For a public client demo, deploy to Vercel and use the HTTPS Vercel URL.

## Environment

Create `.env.local` from `.env.example`.

### Clerk

1. Create an application in Clerk.
2. Add the publishable and secret keys.
3. Set sign-in and sign-up URLs to `/login`.
4. Set post-auth redirects to `/dashboard`.

### OpenAI

1. Create an OpenAI API key.
2. Set `OPENAI_API_KEY`.
3. Keep `OPENAI_IMAGE_MODEL=gpt-image-1` unless your account is configured for another image editing model.
4. Keep `OPENAI_TOUR_MODEL=gpt-4o-mini` for the virtual-tour capture QA endpoint, or replace it with your preferred OpenAI text/vision model.
5. Keep `OPENAI_IMAGE_QUALITY=medium` for faster Vercel demos; switch to `high` only when render quality matters more than speed.

### Cloudinary

1. Create a Cloudinary cloud.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. Set `CLOUDINARY_UPLOAD_FOLDER=tempocasa-smartstage`.

## Deployment

1. Create a new GitHub repo, recommended name: `tempocasa-smartstage`.
2. Push this folder to that repo.
3. Import the repo into Vercel as a new project.
4. Add all variables from `.env.example`.
5. Deploy with the default Next.js build settings.

## Project Structure

```text
src/app               Next.js app router pages and API routes
src/components        Brand, landing, auth, dashboard, upload, staging, project, and download UI
src/lib/ai            Real-estate staging prompt engine
src/lib/server        Pilot project registry for API responses
public/assets         Project-owned property visuals and app icon
docs                  Setup, AI pipeline, and deployment notes
```
