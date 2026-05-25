# Setup Guide

## 1. Install

```bash
cd tempocasa-smartstage
npm install
npm run dev
```

## 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 3. Clerk

Create a Clerk application and set:

- Sign-in URL: `/login`
- Sign-up URL: `/login`
- After sign-in URL: `/dashboard`
- After sign-up URL: `/dashboard`

The dashboard, staging route, and project route are protected by Clerk middleware.

## 4. Cloudinary

Create an API key in Cloudinary and use the cloud name, key, and secret in `.env.local`.

Images are uploaded to:

```bash
tempocasa-smartstage/
```

Change the folder with `CLOUDINARY_UPLOAD_FOLDER`.

## 5. OpenAI

Create an OpenAI API key and set:

```bash
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1
```

The image editing route is `/api/stage`. It accepts:

- `image`: JPG, PNG, or WEBP room photo
- `mask`: optional PNG mask
- `roomType`
- `style`
- `stagingLevel`
- `projectName`

If `OPENAI_API_KEY` is missing, the route returns `202` with the generated prompt package and project metadata instead of failing silently.

## 6. Mobile Camera Demo

The dashboard upload panel includes a `Take Photo` action. On iPhone and Android, this opens the rear camera through the browser's native image picker and returns a JPG to the staging workflow.

For the simplest same-network demo, run the dev server on `0.0.0.0`, open the LAN URL on the phone, and tap `Take Photo`.

## 7. Virtual Tour 3D Processing

The virtual-tour page uses `/api/tour/process` for the in-app `Create 3D tour` button.

For a polished demo without a reconstruction provider, leave these values blank. The app will show a processing state and then load the bundled sample SuperSplat scene:

```bash
TOUR_RECONSTRUCTION_API_URL=
TOUR_RECONSTRUCTION_API_KEY=
TOUR_RECONSTRUCTION_STATUS_URL=
```

When your reconstruction API is ready, set:

```bash
TOUR_RECONSTRUCTION_API_URL=https://your-pipeline.example.com/reconstruct
TOUR_RECONSTRUCTION_API_KEY=your_pipeline_key
TOUR_RECONSTRUCTION_AUTH_HEADER=Authorization
TOUR_RECONSTRUCTION_STATUS_URL=https://your-pipeline.example.com/jobs/{jobId}
TOUR_RECONSTRUCTION_OUTPUT_FORMAT=sog
```

The app sends multipart `FormData` containing:

- `manifest`: JSON room capture metadata
- `mediaIndex`: JSON mapping of each file to its room and angle
- `media`: captured photos and walkthrough videos

The API should return JSON with a ready scene URL, or a job to poll:

```json
{
  "status": "processing",
  "jobId": "abc123",
  "statusUrl": "https://your-pipeline.example.com/jobs/abc123"
}
```

When complete, return one of:

```json
{
  "status": "ready",
  "sogUrl": "https://cdn.example.com/tours/property-1.sog",
  "viewerUrl": "https://your-viewer.example.com/property-1"
}
```
