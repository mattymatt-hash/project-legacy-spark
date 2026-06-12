import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingForm } from "@/components/seller/ListingForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seller/listings/new")({
  head: () => ({ meta: [{ title: "New listing — NoBS Market" }] }),
  component: NewListing,
});

function NewListing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/seller" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold">New listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">List something for sale. You can edit it later.</p>
        <div className="mt-8">
          <ListingForm mode="create" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
