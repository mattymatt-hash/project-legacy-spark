import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingForm } from "@/components/seller/ListingForm";
import { ListingFormSkeleton } from "@/components/marketplace/skeletons";
import { getMyListing } from "@/lib/listings.functions";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seller/listings/$id/edit")({
  head: () => ({ meta: [{ title: "Edit listing — NoBS Market" }] }),
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const load = useServerFn(getMyListing);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-listing", id],
    queryFn: () => load({ data: { id } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/seller" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold">Edit listing</h1>
        {isLoading ? (
          <div className="mt-8"><ListingFormSkeleton /></div>
        ) : error ? (
          <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p>
        ) : !data ? (
          <p className="mt-6 text-muted-foreground">Not found.</p>
        ) : (
          <div className="mt-8">
            <ListingForm mode="edit" initial={data} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
