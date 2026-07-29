import React from "react";
import clsx from "clsx";
import { Star, CheckCircle, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../data/mockData";
import type { Service } from "../../types";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-indigo-500",
];

export const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ── Service Card ─────────────────────────────────────────────────────────── */
export const ServiceCard: React.FC<{
  service: Service;
  onCardClick: () => void;
}> = ({ service, onCardClick }) => {
  const label =
    service.priceType === "hourly"
      ? "/hr"
      : service.priceType === "starting_from"
        ? " onwards"
        : "";
  const initials = service.providerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      onClick={onCardClick}
      className="bg-white rounded-2xl border border-slate-100/70 shadow-soft overflow-hidden hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
    >
      <div
        className={clsx(
          "h-32 bg-gradient-to-br flex items-center justify-center relative",
          service.imageColor,
        )}
      >
        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
          {service.imageIcon}
        </span>
        <span className="absolute top-2.5 left-2.5 bg-white/90 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
          {service.category}
        </span>
        {service.featured && (
          <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            ⭐ Top Rated
          </span>
        )}
      </div>
      <div className="p-3 sm:p-3.5">
        <p className="text-base font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-violet-700 transition-colors">
          {service.title}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <div
            className={clsx(
              "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0",
              avatarColor(service.providerName),
            )}
          >
            {initials}
          </div>
          <span className="text-xs text-slate-500 truncate flex-1">
            {service.providerName}
          </span>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-0.5">
            <CheckCircle className="h-2.5 w-2.5" /> PRO
          </span>
        </div>
        {service.rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 bg-emerald-500 rounded px-1.5 py-0.5">
              <span className="text-[10px] font-bold text-white leading-none">
                {service.rating.toFixed(1)}
              </span>
              <Star className="h-2.5 w-2.5 fill-white text-white" />
            </div>
            {service.reviewCount > 0 && (
              <span className="text-[10px] text-slate-400">
                ({service.reviewCount.toLocaleString()})
              </span>
            )}
            <span className="ml-auto text-[10px] text-slate-400">
              {service.deliveryTime}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1 mb-2.5">
          <span className="text-base font-bold text-violet-700">
            {formatCurrency(service.price)}
          </span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCardClick();
          }}
          className="w-full text-xs font-bold py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 active:scale-95"
        >
          Book Now <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
