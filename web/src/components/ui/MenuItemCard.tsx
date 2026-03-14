import ItemImage from "./ItemImage";
import type { MenuItem } from "@/lib/api";

type Props = {
  item: MenuItem;
  compact?: boolean;
  action?: React.ReactNode;
};

export default function MenuItemCard({ item, compact = false, action }: Props) {
  const price = `$${parseFloat(item.price).toFixed(2)}`;

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-3 px-4" style={{ borderBottom: "1px solid var(--kc-cream-dark)" }}>
        <ItemImage name={item.name} imageUrl={item.image_url} size={52} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ fontFamily: "var(--font-heading)" }}>{item.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>{item.category?.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-bold text-sm">{price}</span>
          {action}
        </div>
      </div>
    );
  }

  return (
    <div className="kc-card flex flex-col items-center text-center p-5 gap-4 hover:shadow-md transition-shadow">
      <ItemImage name={item.name} imageUrl={item.image_url} size={96} />
      <div className="flex-1">
        <h3 className="font-bold text-base leading-snug" style={{ fontFamily: "var(--font-heading)" }}>
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--kc-muted)" }}>
            {item.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between w-full">
        <span className="font-bold text-base">{price}</span>
        {item.is_featured && (
          <span className="kc-badge kc-badge-gold">Featured</span>
        )}
        {action}
      </div>
    </div>
  );
}
