import { 
  Laptop, 
  Car, 
  Home, 
  Sparkles, 
  Plane, 
  FileText,
  type LucideIcon 
} from "lucide-react";

export type ReceiptCategory = 
  | "Essential Living"
  | "Transport"
  | "Lifestyle & Leisure"
  | "Electronics & Tech"
  | "Travel & Lodging"
  | "Other";

export interface CategoryStyle {
  name: ReceiptCategory;
  gradientClass: string;
  badgeClass: string;
  icon: LucideIcon;
  iconColor: string;
  bgMuted: string;
}

export const CATEGORIES: Record<ReceiptCategory, CategoryStyle> = {
  "Essential Living": {
    name: "Essential Living",
    gradientClass: "from-emerald-500/20 to-teal-500/10",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: Home,
    iconColor: "text-emerald-500",
    bgMuted: "bg-emerald-500/5",
  },
  "Transport": {
    name: "Transport",
    gradientClass: "from-amber-500/20 to-orange-500/10",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Car,
    iconColor: "text-amber-500",
    bgMuted: "bg-amber-500/5",
  },
  "Lifestyle & Leisure": {
    name: "Lifestyle & Leisure",
    gradientClass: "from-rose-500/20 to-pink-500/10",
    badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    icon: Sparkles,
    iconColor: "text-rose-500",
    bgMuted: "bg-rose-500/5",
  },
  "Electronics & Tech": {
    name: "Electronics & Tech",
    gradientClass: "from-cyan-500/20 to-sky-500/10",
    badgeClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    icon: Laptop,
    iconColor: "text-cyan-500",
    bgMuted: "bg-cyan-500/5",
  },
  "Travel & Lodging": {
    name: "Travel & Lodging",
    gradientClass: "from-sky-500/20 to-cyan-500/10",
    badgeClass: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    icon: Plane,
    iconColor: "text-sky-500",
    bgMuted: "bg-sky-500/5",
  },
  "Other": {
    name: "Other",
    gradientClass: "from-slate-500/20 to-gray-500/10",
    badgeClass: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    icon: FileText,
    iconColor: "text-slate-500",
    bgMuted: "bg-slate-500/5",
  },
};

/**
 * Returns matching CategoryStyle, defaulting to 'Other' if not matched.
 */
export function getCategoryStyle(categoryName?: string | null): CategoryStyle {
  if (!categoryName) return CATEGORIES["Other"];
  
  // Normalize checking
  const name = categoryName.trim();
  if (name in CATEGORIES) {
    return CATEGORIES[name as ReceiptCategory];
  }
  
  // Fuzzy match mapping
  const normalized = name.toLowerCase();
  if (normalized.includes("essential") || normalized.includes("living") || normalized.includes("grocery") || normalized.includes("rent") || normalized.includes("utility")) {
    return CATEGORIES["Essential Living"];
  }
  if (normalized.includes("transport") || normalized.includes("car") || normalized.includes("fuel") || normalized.includes("gas") || normalized.includes("cab") || normalized.includes("taxi")) {
    return CATEGORIES["Transport"];
  }
  if (normalized.includes("lifestyle") || normalized.includes("leisure") || normalized.includes("dining") || normalized.includes("shopping") || normalized.includes("food") || normalized.includes("cafe")) {
    return CATEGORIES["Lifestyle & Leisure"];
  }
  if (normalized.includes("tech") || normalized.includes("electronics") || normalized.includes("gadget") || normalized.includes("laptop") || normalized.includes("phone")) {
    return CATEGORIES["Electronics & Tech"];
  }
  if (normalized.includes("travel") || normalized.includes("lodging") || normalized.includes("flight") || normalized.includes("hotel") || normalized.includes("stay")) {
    return CATEGORIES["Travel & Lodging"];
  }

  return CATEGORIES["Other"];
}
