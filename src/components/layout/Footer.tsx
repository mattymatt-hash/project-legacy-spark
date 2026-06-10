export function Footer() {
  return (
    <footer className="mt-24 border-t bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <h4 className="font-display text-xl font-bold">NoBS<span style={{ color: "var(--color-primary)" }}>.</span>Market</h4>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            A marketplace for things made and chosen by people who give a damn. No dropshippers. No drama.
          </p>
        </div>
        <FooterCol title="Shop" items={["Browse all", "New this week", "Sale", "Gift cards"]} />
        <FooterCol title="Sell" items={["Open a store", "Seller handbook", "Fees", "Shipping tools"]} />
        <div>
          <h5 className="mb-3 text-sm font-semibold">Get the drop</h5>
          <p className="mb-3 text-sm text-muted-foreground">One short email a week. New finds, fresh sellers.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input type="email" placeholder="you@nobs.email" className="flex-1 rounded-full border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <span>© {new Date().getFullYear()} NoBS Market. Built by humans.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h5 className="mb-3 text-sm font-semibold">{title}</h5>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}><a href="#" className="hover:text-foreground">{i}</a></li>
        ))}
      </ul>
    </div>
  );
}
