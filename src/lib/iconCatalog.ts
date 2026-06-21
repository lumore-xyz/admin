import { iconNames } from "lucide-react/dynamic";

import type { AdminOptionIcon } from "@/lib/admin-api";

export type AdminIconCatalog = {
  libraries: string[];
  grouped: Array<{
    category: string;
    icons: AdminOptionIcon[];
  }>;
  flat: AdminOptionIcon[];
};

const LUCIDE_CATEGORY_ORDER = ["All icons"] as const;

const LUCIDE_FLAT_LIST: AdminOptionIcon[] = iconNames.map((name) => ({
  library: "Lucide",
  name,
}));

const LUCIDE_CATALOG: Record<string, AdminOptionIcon[]> = {
  "All icons": LUCIDE_FLAT_LIST,
};

export const ADMIN_ICON_CATALOG: AdminIconCatalog = {
  libraries: ["Lucide"],
  grouped: LUCIDE_CATEGORY_ORDER.map((category) => ({
    category,
    icons: LUCIDE_CATALOG[category] ?? [],
  })).filter((group) => group.icons.length > 0),
  flat: LUCIDE_FLAT_LIST,
};