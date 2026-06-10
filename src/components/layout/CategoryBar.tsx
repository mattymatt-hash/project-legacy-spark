import { Link } from "@tanstack/react-router";
import { categories } from "@/lib/mock/data";

export function CategoryBar() {
  return (
    <div className="border-b bg-surface">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm sm:px-6">
        <Link to="/browse" className="whitespace-nowrap rounded-full px-3 py-1.5 font-medium hover:bg-muted">All</Link>
        {categories.map((c) => (
          <Link key={c.slug} to="/browse" search={{ category: c.slug }} className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-muted">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
