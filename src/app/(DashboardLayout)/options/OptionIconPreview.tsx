import { CircleHelp } from "lucide-react";
import { DynamicIcon, iconNames } from "lucide-react/dynamic";
import type { ComponentProps } from "react";
import type { IconType } from "react-icons";
import * as Ionicons from "react-icons/io5";

interface OptionIconPreviewProps extends Omit<ComponentProps<"svg">, "ref"> {
  library: string;
  name: string;
}

type LucideIconName = (typeof iconNames)[number];

const lucideIconNameSet = new Set<string>(iconNames);

const toIoniconComponentName = (name: string) =>
  `Io${name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;

const ioniconAliases: Record<string, keyof typeof Ionicons> = {
  "globe-americas-outline": "IoEarthOutline",
  "location-circle-outline": "IoLocationOutline",
};

export function OptionIconPreview({
  library,
  name,
  ...props
}: OptionIconPreviewProps) {
  if (library === "Lucide" && lucideIconNameSet.has(name)) {
    return <DynamicIcon name={name as LucideIconName} {...props} />;
  }

  if (library === "Ionicons") {
    const componentName =
      ioniconAliases[name] || toIoniconComponentName(name);
    const LegacyIcon = Ionicons[
      componentName as keyof typeof Ionicons
    ] as IconType | undefined;

    if (LegacyIcon) {
      return <LegacyIcon aria-label={name} {...props} />;
    }
  }

  return <CircleHelp aria-label={`${name} icon unavailable`} {...props} />;
}
