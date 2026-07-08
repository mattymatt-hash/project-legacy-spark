import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  isCurrentUserAdmin,
  adminListListings,
  adminSetListingStatus,
  adminDeleteListing,
  adminListReviews,
  adminDeleteReview,
  adminListUsers,
  adminSetUserRole,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { TableRowsSkeleton } from "@/components/marketplace/skeletons";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — NoBS Market" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Tab = "listings" | "reviews" | "users";

function AdminPage() {
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const { data: gate, isLoading } = useQuery({
    queryKey: ["admin", "gate"],
    queryFn: () => checkAdmin(),
  });
  const [tab, setTab] = useState<Tab>("listings");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    );
  }
  if (!gate?.admin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have access to this area.
          </p>
          <Button asChild className="mt-4"><Link to="/">Back home</Link></Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Moderate listings, reviews, and users.</p>

        <div className="mt-6 flex gap-1 border-b">
          {(["listings", "reviews", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 ${
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "listings" && <ListingsPanel />}
          {tab === "reviews" && <ReviewsPanel />}
          {tab === "users" && <UsersPanel />}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ListingsPanel() {
  const [q, setQ] = useState("");
  const load = useServerFn(adminListListings);
  const setStatus = useServerFn(adminSetListingStatus);
  const del = useServerFn(adminDeleteListing);
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "listings", q],
    queryFn: () => load({ data: { q: q || undefined, limit: 100 } }),
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "active" | "archived" }) => setStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "listings"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <Input
        placeholder="Search title…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Store</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={5}>Loading…</td></tr>}
            {rows?.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  <Link to="/product/$id" params={{ id: r.id }} className="hover:underline">{r.title}</Link>
                </td>
                <td className="p-2 text-muted-foreground">{r.store?.name ?? "—"}</td>
                <td className="p-2">{formatPrice(r.price_cents)}</td>
                <td className="p-2"><Badge variant="secondary">{r.status}</Badge></td>
                <td className="p-2 text-right space-x-2">
                  {r.status === "active" ? (
                    <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: r.id, status: "archived" })}>
                      Hide
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: r.id, status: "active" })}>
                      Restore
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => confirm("Delete listing permanently?") && delMut.mutate(r.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewsPanel() {
  const load = useServerFn(adminListReviews);
  const del = useServerFn(adminDeleteReview);
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => load({ data: { limit: 100 } }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-2 text-left">Rating</th>
            <th className="p-2 text-left">Review</th>
            <th className="p-2 text-left">Listing</th>
            <th className="p-2 text-left">Store</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td className="p-4" colSpan={5}>Loading…</td></tr>}
          {rows?.map((r: any) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{"★".repeat(r.rating)}</td>
              <td className="p-2 max-w-md"><p className="line-clamp-3">{r.body || <em className="text-muted-foreground">no comment</em>}</p></td>
              <td className="p-2">{r.listing?.title ?? "—"}</td>
              <td className="p-2 text-muted-foreground">{r.store?.name ?? "—"}</td>
              <td className="p-2 text-right">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => confirm("Delete this review?") && delMut.mutate(r.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersPanel() {
  const [q, setQ] = useState("");
  const load = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetUserRole);
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () => load({ data: { q: q || undefined, limit: 100 } }),
  });
  const roleMut = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "moderator"; grant: boolean }) =>
      setRole({ data: v }),
    onSuccess: () => {
      toast.success("Roles updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <Input
        placeholder="Search display name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Roles</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={3}>Loading…</td></tr>}
            {rows?.map((r: any) => {
              const isAdmin = r.roles.includes("admin");
              const isMod = r.roles.includes("moderator");
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {r.avatar_url && <img src={r.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />}
                      <div>
                        <div className="font-medium">{r.display_name || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">{r.id.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 space-x-1">
                    {r.roles.length === 0 ? <span className="text-muted-foreground">user</span> :
                      r.roles.map((role: string) => <Badge key={role} variant="secondary">{role}</Badge>)}
                  </td>
                  <td className="p-2 text-right space-x-2">
                    <Button
                      size="sm"
                      variant={isMod ? "outline" : "secondary"}
                      onClick={() => roleMut.mutate({ user_id: r.id, role: "moderator", grant: !isMod })}
                    >
                      {isMod ? "Remove mod" : "Make mod"}
                    </Button>
                    <Button
                      size="sm"
                      variant={isAdmin ? "outline" : "default"}
                      onClick={() => roleMut.mutate({ user_id: r.id, role: "admin", grant: !isAdmin })}
                    >
                      {isAdmin ? "Remove admin" : "Make admin"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
