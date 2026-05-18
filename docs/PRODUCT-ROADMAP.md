# TEMPOCASA SMARTSTAGE Product Roadmap

This roadmap preserves the next product direction for TEMPOCASA SMARTSTAGE: move from a single-image virtual staging demo into a full property media pipeline, then into 360 tours and later VR / mixed reality walkthroughs.

## Product Direction

TEMPOCASA SMARTSTAGE should support the complete real-estate visual workflow:

1. Upload or capture photos of an existing property.
2. Generate clean empty-room versions from occupied or outdated rooms.
3. Save the empty versions into the media library as reusable source assets.
4. Use those empty images to generate staged listing images by room type and style.
5. Save staged outputs as property-ready marketing assets.
6. Build 360 room views and property tours from approved media.
7. Later, upgrade tours into WebXR-ready walkthroughs for VR and mixed reality devices.

The system must always preserve property trust: the architecture, room geometry, lighting direction, camera perspective, fixed finishes, and listing-safe realism are more important than dramatic AI creativity.

## Recommended Workflow

The best practical workflow is a staged media pipeline, not one giant AI generation step.

### 1. Source Media

Users should be able to create a property project and add:

- original room photos
- phone camera captures
- 360 panorama captures
- optional floor plans
- room labels and metadata

Every media item should be stored as an asset with a type:

- `original`
- `empty`
- `staged`
- `panorama`
- `tour-node`
- `download`

Cloudinary remains the binary storage layer. The app should add a persistent database for production metadata, keyed by Clerk user ID, property ID, room ID, source asset ID, generated asset ID, prompt, model, and status.

### 2. Empty-Room Generation

The first major new feature should be an "Empty Room" workflow:

1. Upload occupied, outdated, or cluttered room photo.
2. Select `Empty Room`.
3. Add optional prompt notes.
4. AI removes movable furniture, clutter, rugs, plants, loose decor, and personal items.
5. AI reconstructs clean walls, flooring, counters, cabinetry faces, trim, and shadows where objects were removed.
6. Save output into an `Empty Rooms` media folder.

This should use the existing OpenAI image editing route, optional masks, and the strict reference-lock prompt rules already in the app.

### 3. Virtual Staging From Empty Assets

After an empty-room image exists, it becomes the preferred input for staging.

Users should be able to choose a saved empty image, then generate:

- living room staging
- bedroom staging
- kitchen refresh or styling
- bathroom styling
- dining room staging
- studio apartment staging
- home office staging
- entryway / hallway styling
- balcony / terrace styling
- garden / outdoor staging

Style packs should remain curated and real-estate-safe:

- Luxury Modern
- Scandinavian
- Minimalist
- Contemporary
- Luxury Airbnb
- Mediterranean
- High-End Penthouse
- Japandi
- Outdoor Luxury
- Family Rental Ready

Each generated staged image should keep a visible lineage:

`original -> empty -> staged`

That lineage is important for review, downloads, and client trust.

### 4. Media Library And Saved Folders

The media library should become a central workspace, with folders:

- Originals
- Empty Rooms
- Staged Renders
- 360 Panoramas
- Tours
- Downloads

Each asset should support:

- preview
- reuse as input
- save to property
- compare before/after
- download
- delete/archive
- metadata view

### 5. 360 And Virtual Tour Strategy

For a credible real-estate demo, the first 360 version should be panorama-based rather than full game-like 3D.

Recommended path:

1. Capture true 360 panoramas for each room where possible.
2. Store each panorama as a room node.
3. Build a virtual tour graph using hotspots between rooms.
4. Render the tour in a web viewer with room navigation, labels, floor-plan/minimap support, and fullscreen mode.
5. Add WebXR / VR support only after the normal web tour is stable.

This is more reliable than trying to invent a true 360 room from one normal photo. A single ordinary photo can produce a nice staged listing image, but it usually cannot produce a trustworthy walkable 360 room without hallucinating unseen walls and geometry. For real-estate trust, true 360 capture or multi-view capture is the safer input.

### 6. Viewer Technology Recommendation

Use a progressive viewer stack:

1. `Pannellum` or `Marzipano` for the first 360 panorama viewer.
2. Custom React tour builder for hotspots, room labels, and property navigation.
3. `Three.js` for advanced WebGL scenes and future WebXR mode.
4. WebXR only for the later VR / mixed reality demo, served over HTTPS.

This gives a working property-tour demo quickly while keeping the architecture ready for VR.

### 7. Future Walkable 3D

The later walkable experience should be treated as a separate 3D capture / reconstruction layer.

Possible inputs:

- true 360 panoramas
- phone LiDAR scans where available
- multi-view room photos
- depth maps
- floor plans
- third-party capture integrations

Possible outputs:

- hotspot panorama tour
- floor-plan linked tour
- lightweight 3D mesh walkthrough
- Gaussian-splat / NeRF-style scene viewer
- WebXR headset mode

For the pilot, avoid promising true Matterport-style spatial accuracy from one image. Start with a polished panorama tour, then add 3D when the capture workflow supports it.

## Implementation Phases

### Phase 1: Finish Media Pipeline

- Add persistent media folders in the UI.
- Save generated outputs by type: original, empty, staged.
- Add "Use as source" from any saved media asset.
- Add generation lineage and project metadata.
- Add batch upload for multiple property photos.

### Phase 2: Empty-Room Workflow

- Make `Empty Room` a first-class action.
- Save outputs automatically to the `Empty Rooms` folder.
- Add before/after comparison for original vs empty.
- Add optional mask editor for protected architectural zones.

### Phase 3: Staging From Empty Rooms

- Add "Stage this empty room" action.
- Expand room categories and style packs.
- Add custom prompt notes.
- Save all staged variants as linked children of the empty image.

### Phase 4: 360 Tour MVP

- Add panorama upload support.
- Add 360 viewer page.
- Add room nodes and hotspots.
- Add property tour editor.
- Add shareable client demo link.

### Phase 5: Advanced Tour And VR

- Add Three.js scene mode.
- Add floor-plan navigation.
- Add WebXR headset entry where browser/device support exists.
- Add mobile-safe fallback for devices without WebXR.

## Research Notes

- OpenAI image APIs support image generation and editing with image inputs, which fits the current controlled empty/stage pipeline: https://developers.openai.com/api/docs/guides/images-vision
- OpenAI recommends API request IDs and production troubleshooting metadata, which should be added before release: https://developers.openai.com/api/reference/overview
- Cloudinary supports server-side authenticated uploads and asset organization; API secrets must never be exposed client-side: https://cloudinary.com/documentation/image_upload_api_reference
- Marzipano is a strong candidate for tour MVPs because it supports modern desktop/mobile browsers, hotspots, and exported web tours: https://www.marzipano.net/index.html
- Pannellum is a lightweight WebGL panorama viewer that supports equirectangular, cube map, and multiresolution panorama formats: https://pannellum.org/documentation/overview/
- Three.js supports WebXR through VRButton and renderer XR mode, making it appropriate for the later VR layer: https://threejs.org/manual/en/webxr-basics.html
- MDN notes WebXR requires secure contexts and is not universally supported, so VR must be treated as an enhancement with fallbacks: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
