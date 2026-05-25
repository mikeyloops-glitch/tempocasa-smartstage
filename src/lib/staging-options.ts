import type { RoomType, StagingLevel, StagingStyle } from "@/lib/types";

export const roomTypes: RoomType[] = [
  "Living Room",
  "Lounge",
  "Living Room + Kitchen",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Studio Apartment",
  "Dining Room",
  "Home Office",
  "Entryway",
  "Balcony / Terrace",
  "Garden"
];

export const stagingStyles: StagingStyle[] = [
  "Luxury Modern",
  "Scandinavian",
  "Minimalist",
  "Contemporary",
  "Luxury Airbnb",
  "Mediterranean",
  "High-End Penthouse",
  "Japandi",
  "Outdoor Luxury",
  "Family Rental Ready"
];

export const stagingLevels: StagingLevel[] = ["Light", "Medium", "Luxury"];

export const roomDescriptors: Record<RoomType, string> = {
  "Living Room": "premium living area with a sofa layout, rug, media wall, layered lighting, and refined decor",
  Lounge: "dedicated lounge or soggiorno staging with proportionate sofa seating, coffee table, rug, media or conversation focus, soft lighting, and calm luxury decor",
  "Living Room + Kitchen": "open-plan living and kitchen area with a coherent lounge zone, media wall or conversation seating, dining or island relationship, preserved kitchen footprint and finishes, practical decor, and clear circulation between cooking and relaxing areas",
  Bedroom: "serene primary bedroom with luxury bedding, bedside lighting, understated art, and hotel-grade styling",
  Kitchen: "neat kitchen presentation with uncluttered counters, proportionate stools or dining pieces only where they fit, warm practical lighting, and restrained listing styling without remodeling fixed cabinetry or doors",
  Bathroom: "spa-like bathroom styling with towels, premium fixtures, soft lighting, and restrained accessories",
  "Studio Apartment": "space-efficient studio apartment layout with sleeping, seating, and dining zones scaled to the room",
  "Dining Room": "elegant dining setup with a proportionate table, chairs, statement light, art, and table styling",
  "Home Office": "premium home office with a refined desk, ergonomic chair, shelving, task lighting, and calm luxury work styling",
  Entryway: "welcoming entryway with console, mirror, refined lighting, art, and restrained decor without blocking circulation",
  "Balcony / Terrace": "luxury outdoor terrace staging with weather-safe seating, planters, soft exterior lighting, and open usable space",
  Garden: "listing-ready garden or outdoor lounge staging with proportionate exterior furniture, planters, path visibility, and natural daylight"
};

export const styleDescriptors: Record<StagingStyle, string> = {
  "Luxury Modern": "Italian luxury modern interiors, quiet sophistication, designer furniture, marble, wool, soft leather, and controlled contrast",
  Scandinavian: "bright Scandinavian warmth, natural oak, pale textiles, clean silhouettes, and restrained decor",
  Minimalist: "minimal premium staging, generous negative space, architectural clarity, subtle textures, and very few objects",
  Contemporary: "current high-end residential staging, balanced shapes, refined decor, and polished real-estate photography appeal",
  "Luxury Airbnb": "high-performing premium rental styling, inviting seating, warm lighting, durable luxury finishes, and editorial comfort",
  Mediterranean: "elegant Mediterranean Italian styling, linen, travertine, warm neutrals, artisanal accents, and calm sunlight",
  "High-End Penthouse": "penthouse-grade staging, statement furniture, high-gloss accents, curated art, and luxury urban atmosphere",
  Japandi: "Japandi restraint, low-profile furniture, organic texture, soft wood, stone, linen, and calm composition",
  "Outdoor Luxury": "premium outdoor living with restrained resort styling, weather-safe materials, stone, greenery, exterior lighting, and clean sightlines",
  "Family Rental Ready": "durable premium rental styling, warm practical furniture, approachable comfort, uncluttered decor, and broad market appeal"
};

export const levelDescriptors: Record<StagingLevel, string> = {
  Light: "light staging with a few essential furniture pieces and open visual breathing room",
  Medium: "balanced staging with complete functional furniture zones and tasteful decor",
  Luxury: "full luxury staging with premium furniture, layered decor, statement lighting, and listing-ready polish"
};
