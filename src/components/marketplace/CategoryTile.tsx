import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/mock/types";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link to="/browse" search={{ category: category.slug }} className="group relative block overflow-hidden rounded-2xl">
      <div className="aspect-[4/3] bg-muted">
        <img src={category.image} alt={category.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-background">
        <h3 className="font-display text-xl font-semibold">{category.name}</h3>
        <p className="text-xs opacity-90">{category.blurb}</p>
      </div>
    </Link>
  );
}
