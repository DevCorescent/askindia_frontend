import React from "react";
import clsx from "clsx";
import { Heart, Star } from "lucide-react";
import { formatCurrency } from "../../data/mockData";
import type { Product } from "../../types";

/* Deterministic placeholder rating/review counts, derived from the product id
   so a given product always shows the same numbers. */
export const getRating = (id: string) =>
  (
    3.8 +
    (id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 12) / 10
  ).toFixed(1);

export const getReviews = (id: string) =>
  100 + (id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 1900);

/* ── Product Card ─────────────────────────────────────────────────────────── */
export const ProductCard: React.FC<{
  product: Product;
  available: boolean;
  added: boolean;
  wishlisted: boolean;
  onAdd: (e: React.MouseEvent) => void;
  onClick: () => void;
  onWish: (e: React.MouseEvent) => void;
}> = ({ product, available, added, wishlisted, onAdd, onClick, onWish }) => {
  const disc =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white rounded-2xl border border-slate-100/70 shadow-soft overflow-hidden hover:-translate-y-1 transition-all duration-200 group cursor-pointer",
        !available && "opacity-60",
      )}
    >
      <div
        className={clsx(
          "relative h-40 sm:h-44 bg-gradient-to-br flex items-center justify-center",
          product.imageColor,
        )}
      >
        <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
          {product.imageIcon}
        </span>
        <button
          onClick={onWish}
          className={clsx(
            "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
            wishlisted
              ? "bg-red-500 opacity-100"
              : "bg-white/90 opacity-0 group-hover:opacity-100",
          )}
        >
          <Heart
            className={clsx(
              "h-3.5 w-3.5",
              wishlisted ? "fill-white text-white" : "text-slate-500",
            )}
          />
        </button>
        {disc > 0 && available && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            -{disc}%
          </span>
        )}
        {product.featured && available && !disc && (
          <span className="absolute top-2.5 left-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded shadow">
            ⭐ Top Pick
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-3.5">
        {product.brand && (
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5 truncate">
            {product.brand}
          </p>
        )}
        <p className="text-base font-semibold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-accent-600 transition-colors min-h-[2.75rem]">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 bg-emerald-500 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-white leading-none">
              {getRating(product.id)}
            </span>
            <Star className="h-2.5 w-2.5 fill-white text-white" />
          </div>
          <span className="text-[10px] text-slate-400">
            ({getReviews(product.id).toLocaleString()})
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-wrap mb-3">
          <span className="text-base sm:text-lg font-bold text-slate-900">
            {formatCurrency(product.price)}
          </span>
          {product.mrp > product.price && (
            <>
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(product.mrp)}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {disc}% off
              </span>
            </>
          )}
        </div>
        <button
          onClick={onAdd}
          disabled={!available}
          className={clsx(
            "w-full text-xs font-bold py-2.5 rounded-xl transition-all",
            added
              ? "bg-emerald-500 text-white shadow-sm"
              : available
                ? "bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow-md active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
          )}
        >
          {added ? "✓ Added!" : available ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
};
