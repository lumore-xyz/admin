"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ADMIN_ICON_CATALOG } from "@/lib/iconCatalog";
import type { AdminOptionIcon } from "@/lib/admin-api";
import { OptionIconPreview } from "./OptionIconPreview";

type IconLibrary = "Lucide";

const ICON_PAGE_SIZE = 100;
const ICON_CATEGORY = "All icons";

export interface AdminOptionIconValue {
  library: IconLibrary;
  name: string;
}

interface OptionIconPickerProps {
  value: { library: string; name: string } | null | undefined;
  onChange: (next: AdminOptionIconValue | null) => void;
  disabled?: boolean;
}

const formatName = (name: string) =>
  name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const lucideIcons: AdminOptionIcon[] = ADMIN_ICON_CATALOG.grouped.find(
  (group) => group.category === ICON_CATEGORY,
)?.icons ?? ADMIN_ICON_CATALOG.flat;

export function OptionIconPicker({
  value,
  onChange,
  disabled,
}: OptionIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(ICON_PAGE_SIZE);

  const filteredIcons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return lucideIcons;
    return lucideIcons.filter((icon) =>
      icon.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const visibleIcons = filteredIcons.slice(0, visibleLimit);
  const hiddenIconCount = filteredIcons.length - visibleIcons.length;

  useEffect(() => {
    setVisibleLimit(ICON_PAGE_SIZE);
  }, [query, open]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full justify-start gap-2"
          >
            {value ? (
              <>
                <OptionIconPreview
                  library={value.library}
                  name={value.name}
                  className="h-4 w-4 shrink-0"
                  aria-hidden
                />
                <span className="truncate font-mono text-xs">
                  {value.name}
                </span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 opacity-70" />
                <span className="text-muted-foreground text-xs">
                  Pick an icon (optional)
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          className="w-80 p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search all Lucide icons..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-72">
              {filteredIcons.length === 0 ? (
                <CommandEmpty>No icons available.</CommandEmpty>
              ) : (
                <CommandGroup
                  heading={`${filteredIcons.length.toLocaleString()} Lucide icons`}
                  className="[&_[cmdk-group-heading]]:text-xs"
                >
                  {visibleIcons.map((icon) => {
                    const isSelected =
                      value?.library === icon.library && value?.name === icon.name;
                    return (
                      <CommandItem
                        key={`${icon.library}:${icon.name}`}
                        value={icon.name}
                        onSelect={() => {
                          onChange({ library: "Lucide", name: icon.name });
                          setOpen(false);
                        }}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={
                            "flex h-7 w-7 items-center justify-center rounded-md border " +
                            (isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground")
                          }
                          aria-hidden
                        >
                          <OptionIconPreview
                            library={icon.library}
                            name={icon.name}
                            className="h-4 w-4"
                            aria-hidden
                          />
                        </span>
                        <span className="truncate font-mono text-xs">
                          {icon.name}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {hiddenIconCount > 0 ? (
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() =>
                      setVisibleLimit((current) => current + ICON_PAGE_SIZE)
                    }
                  >
                    Show {Math.min(ICON_PAGE_SIZE, hiddenIconCount)} more
                  </Button>
                </div>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Clear icon"
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function formatOptionIconName(name: string) {
  return formatName(name);
}