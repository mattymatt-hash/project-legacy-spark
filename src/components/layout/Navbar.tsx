import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag, Search, User, Plus, LogOut, Store } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useFavorites } from "@/lib/store/favorites";
import { useAuth } from "@/lib/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0">
          <span className="font-display text-2xl font-bold tracking-tight">
            NoBS<span style={{ color: "var(--color-primary)" }}>.</span>Market
          </span>
        </Link>

        <div className="hidden flex-1 md:block">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search for stuff worth owning…"
              className="w-full rounded-full border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-card"
            />
          </label>
        </div>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to={user ? "/sell" : "/auth"}>
              <Plus size={16} /> Sell
            </Link>
          </Button>
          <Link to="/" aria-label="Favorites" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
            <Heart size={18} />
            {favCount > 0 && <Badge>{favCount}</Badge>}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
            <ShoppingBag size={18} />
            {count > 0 && <Badge>{count}</Badge>}
          </Link>

          {loading ? (
            <div className="h-10 w-10" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
                <User size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account"><User size={14} className="mr-2" /> Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/sell"><Store size={14} className="mr-2" /> Your store</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut size={14} className="mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="default">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {children}
    </span>
  );
}
