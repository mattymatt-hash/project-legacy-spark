import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { CategoryBar } from "./CategoryBar";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <CategoryBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
