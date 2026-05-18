# Deployment

## Vercel

1. Import the `tempocasa-smartstage` folder into Vercel.
2. Use the default Next.js settings.
3. Add the variables from `.env.example`.
4. Deploy.

## Required Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=tempocasa-smartstage
NEXT_PUBLIC_APP_URL=
```

## Performance Notes

- Landing images are loaded through Next image optimization.
- Generated images should be served from Cloudinary in production.
- Dashboard history is kept lightweight in browser storage for the pilot.
- API routes run in the Node.js runtime for file and SDK support.

## Security Notes

- Keep `OPENAI_API_KEY`, `CLERK_SECRET_KEY`, and `CLOUDINARY_API_SECRET` server-side only.
- Do not expose unsigned Cloudinary admin operations to the browser.
- Keep `/api/stage` protected by Clerk middleware.
