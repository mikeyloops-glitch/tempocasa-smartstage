# AI Pipeline

TEMPOCASA SMARTSTAGE is designed as a controlled virtual staging pipeline.

## Flow

1. User uploads a real room photo.
2. Optional mask is added when the staging area needs tighter control.
3. Prompt engine builds a real-estate-specific staging prompt.
4. OpenAI image editing receives the source image, optional mask, and prompt.
5. Original and staged images are stored in Cloudinary when configured.
6. Project metadata is returned to the dashboard and saved to local project history.

## Media Asset Flow

Generated results are now saved into typed media folders so they can be reused as the next input:

- `original`: the uploaded or captured source photo
- `empty`: an AI-empty-room version of the source photo
- `staged`: a furniture / decor staged version
- `panorama`: future 360 room panoramas
- `tour`: future virtual tour scenes or exports

The intended chain is:

`original -> empty -> staged -> panorama/tour`

For demos, an empty-room result can be selected from Media Library and staged again with furniture using the same locked-reference AI workflow.

## Prompt Priorities

The prompt engine always prioritizes:

- strict camera lock: same camera distance, angle, crop, horizon, visible frame edges, lens feel, and perspective
- exact wall, window, door, floor, ceiling, and perspective preservation
- realistic furniture scale
- correct contact shadows
- consistent natural lighting direction
- professional real-estate photography aesthetics
- MLS-safe output

For `Empty Room`, the system should create a clean shell from the same shot. It may remove visible cupboards, kitchen cabinets, wardrobes, counters, appliances, decorative side panels, and other built-in-looking visual clutter when the user wants the room completely empty. It should reconstruct clean wall, floor, ceiling, trim, and shadow surfaces while keeping true structural architecture and the exact camera framing locked.

Uploaded and camera-captured images are normalized into an OpenAI-compatible comparison frame before generation: portrait images become `1024x1536`, landscape images become `1536x1024`, and near-square images become `1024x1024`. The normalized source image is used as the before image, so the generated after image has the same frame shape and the before/after slider does not compare mismatched camera plates.

## Negative Constraints

The prompt explicitly avoids:

- warped walls
- distorted geometry
- unrealistic scaling
- floating furniture
- blurry textures
- duplicate objects
- extra windows
- fantasy architecture
- moved doors
- changed flooring
- inconsistent shadows
- watermarks and text

## Mask Architecture

Masks are optional in the pilot but the route accepts them now. In production, create masks through a browser canvas editor or an automatic segmentation model, then pass the mask file to `/api/stage`.

Mask guidance:

- white or transparent edit area depending on the selected OpenAI image editing model requirements
- keep walls, windows, doors, ceilings, and fixed architectural details protected
- expose floor and furniture zones where staging should be added

## Production Extension

For a multi-user production release, add persistent project storage keyed by Clerk user ID. Cloudinary should remain the image binary store, while database rows should hold:

- Clerk user ID
- original Cloudinary public ID
- staged Cloudinary public ID
- room type
- style
- staging level
- prompt package
- timestamps
- review status

## Virtual Tour Reconstruction Adapter

The AI Virtual Tour page now includes an option-2 provider adapter at `/api/tour/process`.

### In-App Flow

1. User captures 8 guided angles, records walkthrough video, or saves multiple room nodes.
2. User taps `Create 3D tour`.
3. The browser posts a multipart package to `/api/tour/process`.
4. The API route forwards `manifest`, `mediaIndex`, and `media` files to `TOUR_RECONSTRUCTION_API_URL`.
5. If the provider returns a ready `.sog`, `.ply`, scene URL, or viewer URL, the app loads it directly in the SuperSplat viewer.
6. If the provider returns a job ID, the app polls `statusUrl` or `TOUR_RECONSTRUCTION_STATUS_URL` until the asset is ready.
7. If no provider URL is configured, the route returns a demo scene so the product demo remains fully clickable.

### Expected Provider Contract

Request:

- multipart `manifest`: JSON capture metadata
- multipart `mediaIndex`: JSON file-to-angle mapping
- multipart `media`: captured photos and videos
- `outputFormat`: defaults to `sog`
- `viewer`: `supersplat`

Accepted ready response fields:

- `viewerUrl`
- `contentUrl`
- `splatUrl`
- `sogUrl`
- `plyUrl`
- `sceneUrl`

Accepted async response fields:

- `status`: `queued`, `processing`, `ready`, or `failed`
- `jobId`
- `statusUrl`
- `progress`

Vercel should remain the orchestration layer. True Gaussian-splat reconstruction should run in the external provider or GPU worker, not inside the Next.js serverless function.
