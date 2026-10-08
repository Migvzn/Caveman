import Link from "next/link";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

export function FeaturedProducts() {
  const featured = products.filter((p) => p.featured).slice(0, 4);
  return (
    <section id="drop" className="px-[var(--gutter)] py-20 md:py-28" aria-labelledby="drop-title">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
        <div>
          <p className="mono mb-3 text-[11px] text-pink">DROP 01 / {String(products.length).padStart(2, "0")} PIÈCE{products.length > 1 ? "S" : ""}</p>
          <h2 id="drop-title" className="label text-4xl font-black leading-[0.95] md:text-7xl">
            Le drop
            <br />
            du retour
          </h2>
        </div>
        <Link href="/shop" className="btn-ghost">
          Tout le shop →
        </Link>
      </div>
      <div className={`grid gap-x-3 gap-y-10 lg:gap-x-5 ${featured.length === 1 ? "mx-auto max-w-xl grid-cols-1" : featured.length > 2 ? "grid-cols-2 lg:grid-cols-4" : "mx-auto max-w-5xl grid-cols-2"}`}>
        {featured.map((p) => (
          <ProductCard key={p.slug} product={p} sizes={featured.length > 2 ? undefined : featured.length === 1 ? "(min-width: 640px) 576px, 100vw" : "(min-width: 1024px) 512px, 50vw"} />
        ))}
      </div>
    </section>
  );
}
