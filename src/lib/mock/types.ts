export type CategorySlug =
  | "antiques-collectibles"
  | "arts-crafts"
  | "auto-parts"
  | "baby"
  | "books-movies-music"
  | "electronics"
  | "furniture"
  | "health-beauty"
  | "home-kitchen"
  | "home-improvement"
  | "jewelry-watches"
  | "kidswear-baby"
  | "luggage-bags"
  | "menswear"
  | "miscellaneous"
  | "musical-instruments"
  | "patio-garden"
  | "pet-supplies"
  | "sporting-goods"
  | "toys-games"
  | "vehicles"
  | "womenswear";

export interface Category {
  slug: CategorySlug;
  name: string;
  blurb: string;
  image: string;
}
