import Image from "next/image";
import Link from "next/link";
import { isSoldOut, type Product } from "@/data/products";
import { formatPrice } from "@/lib/site";

export function Badge({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);
  const label = soldOut ? "SOLD OUT" : product.badge;
  if (!label) return null;
  const style = soldOut ? "bg-bone text-ink line-through decoration-pink decoration-2" : label === "LIMITÉ" ? "bg-pink text-ink" : "bg-pink-soft text-ink";
  return <span className={`label inline-block px-2 py-1 text-[10px] ${style}`}>{label}</span>;
}

const DEFAULT_SIZES = "(min-width: 1024px) 25vw, 50vw";

export function ProductCard({ product, priority = false, sizes = DEFAULT_SIZES }: { product: Product; priority?: boolean; sizes?: string }) {
  const [main, worn] = product.images;
  const soldOut = isSoldOut(product);
  return (
    <Link href={`/shop/${product.slug}`} data-cursor="VOIR" className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-concrete">
        <Image
          src={main.src}
          alt={main.alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-105 ${worn ? "group-hover:opacity-0" : ""} ${soldOut ? "grayscale" : ""}`}
        />
        {worn && (
          <Image
            src={worn.src}
            alt=""
            fill
            sizes={sizes}
            className="scale-105 object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2 top-2 md:left-3 md:top-3">
          <Badge product={product} />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="label text-[11px] leading-snug transition-colors group-hover:text-pink-soft md:text-xs">{product.name}</h3>
          <p className="mono mt-1 text-[10px] text-current opacity-50">{product.ref}</p>
        </div>
        <p className="label shrink-0 text-[11px] md:text-xs">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
