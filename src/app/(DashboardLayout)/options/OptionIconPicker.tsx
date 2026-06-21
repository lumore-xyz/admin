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
import {
  getOptionIconCatalog,
  type AdminIconCatalogResponse,
  type AdminOptionIcon,
} from "@/lib/admin-api";

type IconLibrary = "Ionicons";

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

export function OptionIconPicker({
  value,
  onChange,
  disabled,
}: OptionIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<AdminIconCatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!open || catalog || loading) return;
    setLoading(true);
    setError("");
    getOptionIconCatalog()
      .then((response) => {
        if (response?.success && response?.data) {
          setCatalog(response.data);
        } else {
          setError("Could not load icon catalog");
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load icons");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, catalog, loading]);

  const groupedIcons = useMemo(() => {
    if (!catalog) return [];
    return catalog.grouped.filter((group) => group.icons.length > 0);
  }, [catalog]);

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
            <Search className="h-4 w-4 opacity-70" />
            {value ? (
              <span className="truncate font-mono text-xs">
                {value.name}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                Pick an icon (optional)
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          className="w-80 p-0"
        >
          <Command shouldFilter>
            <CommandInput placeholder="Search Ionicons..." />
            <CommandList className="max-h-72">
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading icons...
                </div>
              ) : null}
              {error ? (
                <div className="py-6 text-center text-sm text-error">
                  {error}
                </div>
              ) : null}
              {!loading && !error && groupedIcons.length === 0 ? (
                <CommandEmpty>No icons available.</CommandEmpty>
              ) : null}
              {groupedIcons.map((group) => (
                <CommandGroup
                  key={group.category}
                  heading={group.category}
                  className="[&_[cmdk-group-heading]]:text-xs"
                >
                  {group.icons.map((icon: AdminOptionIcon) => {
                    const isSelected = value?.name === icon.name;
                    return (
                      <CommandItem
                        key={`${icon.library}:${icon.name}`}
                        value={icon.name}
                        onSelect={() => {
                          onChange({ library: "Ionicons", name: icon.name });
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
                          {/* Visual placeholder — admin cannot render Ionicons */}
                          <span className="text-[10px] font-bold">
                            {icon.name.charAt(0).toUpperCase()}
                          </span>
                        </span>
                        <span className="truncate font-mono text-xs">
                          {icon.name}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
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
