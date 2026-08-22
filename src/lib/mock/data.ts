import type { Category } from "./types";

const img = (id: string) => `https://images.unsplash.com/${id}?w=800&q=70`;

export const categories: Category[] = [
  { slug: "antiques-collectibles", name: "Antiques & Collectibles", blurb: "The good kind of hoarding", image: img("photo-1606293459339-aa5d34a7b0e1") },
  { slug: "arts-crafts", name: "Arts & Crafts", blurb: "Made by actual humans", image: img("photo-1513519245088-0e12902e5a38") },
  { slug: "auto-parts", name: "Auto Parts", blurb: "Bolts, brakes, and bargains", image: img("photo-1486262715619-67b85e0b08d3") },
  { slug: "baby", name: "Baby", blurb: "Tiny gear, big relief", image: img("photo-1522771930-78848d9293e8") },
  { slug: "books-movies-music", name: "Books, Movies & Music", blurb: "Stories worth a second owner", image: img("photo-1512820790803-83ca734da794") },
  { slug: "electronics", name: "Electronics", blurb: "Tested, working, honest", image: img("photo-1498049794561-7780e7231661") },
  { slug: "furniture", name: "Furniture", blurb: "Things that earn their floor space", image: img("photo-1592078615290-033ee584e267") },
  { slug: "health-beauty", name: "Health & Beauty", blurb: "Simple stuff that works", image: img("photo-1596462502278-27bfdc403348") },
  { slug: "home-kitchen", name: "Home & Kitchen", blurb: "Objects that earn their shelf space", image: img("photo-1493663284031-b7e3aefcae8e") },
  { slug: "home-improvement", name: "Home Improvement", blurb: "For the half-finished project", image: img("photo-1581092918056-0c4c3acd3789") },
  { slug: "jewelry-watches", name: "Jewelry & Watches", blurb: "Small things, long memories", image: img("photo-1515562141207-7a88fb7ce338") },
  { slug: "kidswear-baby", name: "Kidswear & Baby", blurb: "Outgrown, not worn out", image: img("photo-1519457431-44ccd64a579b") },
  { slug: "luggage-bags", name: "Luggage & Bags", blurb: "Built to be dragged around", image: img("photo-1553062407-98eeb64c6a62") },
  { slug: "menswear", name: "Menswear", blurb: "Wear something that isn't everywhere", image: img("photo-1490481651871-ab68de25d43d") },
  { slug: "miscellaneous", name: "Miscellaneous", blurb: "Everything that defies a label", image: img("photo-1481349518771-20055b2a7b24") },
  { slug: "musical-instruments", name: "Musical Instruments", blurb: "Plays better than it looks", image: img("photo-1511379938547-c1f69419868d") },
  { slug: "patio-garden", name: "Patio & Garden", blurb: "For out back", image: img("photo-1416879595882-3373a0480b5b") },
  { slug: "pet-supplies", name: "Pet Supplies", blurb: "Spoil them responsibly", image: img("photo-1548199973-03cce0bbc87b") },
  { slug: "sporting-goods", name: "Sporting Goods", blurb: "Gear with mileage left", image: img("photo-1517649763962-0c623066013b") },
  { slug: "toys-games", name: "Toys & Games", blurb: "All pieces included, promise", image: img("photo-1566576912321-d58ddd7a6088") },
  { slug: "vehicles", name: "Vehicles", blurb: "Keys, titles, no games", image: img("photo-1494976388531-d1058494cdd8") },
  { slug: "womenswear", name: "Womenswear", blurb: "Second-hand, first choice", image: img("photo-1483985988355-763728e1935b") },
];

export const CATEGORY_SLUGS = categories.map((c) => c.slug) as [string, ...string[]];
