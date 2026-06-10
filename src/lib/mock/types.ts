export type CategorySlug =
  | "vintage"
  | "handmade"
  | "home"
  | "fashion"
  | "art"
  | "collectibles";

export interface Category {
  slug: CategorySlug;
  name: string;
  blurb: string;
  image: string;
}

export interface Seller {
  id: string;
  handle: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  sales: number;
  joinedYear: number;
  bio: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  currency: "USD";
  category: CategorySlug;
  condition: "New" | "Like new" | "Good" | "Vintage";
  images: string[];
  description: string;
  sellerId: string;
  rating: number;
  reviewCount: number;
  shippingFrom: string;
  shippingPrice: number;
  tags: string[];
}
