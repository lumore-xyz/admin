"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  OptionIconPicker,
  formatOptionIconName,
} from "./OptionIconPicker";

export interface OptionRowItem {
  label: string;
  value: string;
  icon?: { library: string; name: string } | null;
}

interface OptionRowProps {
  item: OptionRowItem;
  disabled?: boolean;
  onChange: (next: Partial<OptionRowItem>) => void;
  onRemove: () => void;
}

const normalizeIcon = (
  input: { library: string; name: string } | null | undefined,
): { library: "Ionicons"; name: string } | null => {
  if (!input) return null;
  if (input.library !== "Ionicons" || !input.name) return null;
  return { library: "Ionicons", name: input.name };
};

export function OptionRow({ item, disabled, onChange, onRemove }: OptionRowProps) {
  return (
    <div className="grid grid-cols-12 gap-2">
      <Input
        value={item.label || ""}
        onChange={(event) => onChange({ label: event.target.value })}
        placeholder="Label"
        className="col-span-4"
        disabled={disabled}
      />
      <Input
        value={item.value || ""}
        onChange={(event) => onChange({ value: event.target.value })}
        placeholder="Value"
        className="col-span-3"
        disabled={disabled}
      />
      <div className="col-span-3">
        <OptionIconPicker
          value={normalizeIcon(item.icon)}
          onChange={(next) => onChange({ icon: next })}
          disabled={disabled}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="col-span-2"
        onClick={onRemove}
        disabled={disabled}
      >
        Remove
      </Button>
      {item.icon ? (
        <div className="col-span-12 -mt-1">
          <Badge variant="secondary" className="font-mono text-xs">
            Ionicons · {formatOptionIconName(item.icon.name)}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
