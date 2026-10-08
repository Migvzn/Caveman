import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductInfo } from "@/components/shop/ProductInfo";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, isSoldOut, products } from "@/data/products";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: `${product.name} — ILUR.STUDIO`, description: product.description, images: [{ url: product.images[1]?.src ?? product.images[0].src }] },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const related = products.filter((p) => p.slug !== product.slug && !isSoldOut(p)).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.ref,
    brand: { "@type": "Brand", name: "ILUR.STUDIO" },
    description: product.description,
    image: product.images.map((i) => `${site.url}${i.src}`),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: site.currency,
      availability: isSoldOut(product) ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="pt-[var(--header-h)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Fil d'Ariane" className="mono px-[var(--gutter)] py-4 text-[11px] text-bone/50">
        <Link href="/shop" className="hover:text-pink-soft">
          SHOP
        </Link>{" "}
        / <span className="text-bone">{product.name.toUpperCase()}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-12 md:px-[var(--gutter)]">
        <ProductGallery product={product} />
        <div className="px-[var(--gutter)] md:px-0">
          <ProductInfo product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="px-[var(--gutter)] py-24" aria-labelledby="related-title">
          <h2 id="related-title" className="label mb-8 text-2xl font-black md:text-4xl">
            Complète le look
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4 lg:gap-x-5">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
