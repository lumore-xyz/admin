"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AdminUserFilters } from "@/lib/admin-api";
import { useMemo, useState } from "react";

type FilterFieldType = "string" | "boolean" | "number" | "array";

type FilterField = {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
};

const FILTER_FIELDS: FilterField[] = [
  { key: "username", label: "Username", type: "string" },
  { key: "email", label: "Email", type: "string" },
  { key: "phoneNumber", label: "Phone Number", type: "string" },
  { key: "nickname", label: "Nickname", type: "string" },
  { key: "realName", label: "Real Name", type: "string" },
  { key: "gender", label: "Gender", type: "string" },
  { key: "diet", label: "Diet", type: "string" },
  { key: "zodiacSign", label: "Zodiac Sign", type: "string" },
  { key: "maritalStatus", label: "Marital Status", type: "string" },
  { key: "religion", label: "Religion", type: "string" },
  { key: "hometown", label: "Hometown", type: "string" },
  { key: "personalityType", label: "Personality Type", type: "string" },
  { key: "bloodGroup", label: "Blood Group", type: "string" },
  { key: "verificationStatus", label: "Verification Status", type: "string" },
  { key: "verificationMethod", label: "Verification Method", type: "string" },
  { key: "work", label: "Work", type: "string" },
  { key: "institution", label: "Institution", type: "string" },
  { key: "drinking", label: "Lifestyle Drinking", type: "string" },
  { key: "smoking", label: "Lifestyle Smoking", type: "string" },
  { key: "pets", label: "Lifestyle Pets", type: "string" },
  { key: "country", label: "Country", type: "string" },
  { key: "pincode", label: "Pincode", type: "string" },

  { key: "isActive", label: "Is Active", type: "boolean" },
  { key: "isArchived", label: "Is Archived", type: "boolean" },
  { key: "isMatching", label: "Is Matching", type: "boolean" },
  { key: "isVerified", label: "Is Verified", type: "boolean" },
  { key: "emailVerified", label: "Email Verified", type: "boolean" },
  { key: "phoneVerified", label: "Phone Verified", type: "boolean" },
  { key: "isAdmin", label: "Is Admin", type: "boolean" },

  { key: "minAge", label: "Min Age", type: "number" },
  { key: "maxAge", label: "Max Age", type: "number" },
  { key: "minHeight", label: "Min Height", type: "number" },
  { key: "maxHeight", label: "Max Height", type: "number" },
  { key: "minCredits", label: "Min Credits", type: "number" },
  { key: "maxCredits", label: "Max Credits", type: "number" },

  { key: "interests", label: "Interests (Any)", type: "array", placeholder: "music, travel" },
  { key: "languages", label: "Languages (Any)", type: "array", placeholder: "english, hindi" },
  { key: "web3Wallet", label: "Web3 Wallet (Any)", type: "array", placeholder: "0xabc, 0xdef" },

  { key: "prefInterestedIn", label: "Pref Interested In", type: "string" },
  { key: "prefRelationshipType", label: "Pref Relationship Type", type: "string" },
  { key: "prefGoalPrimary", label: "Pref Goal Primary", type: "string" },
  { key: "prefGoalSecondary", label: "Pref Goal Secondary", type: "string" },
  { key: "prefGoalTertiary", label: "Pref Goal Tertiary", type: "string" },
  { key: "prefMinDistance", label: "Pref Min Distance", type: "number" },
  { key: "prefMaxDistance", label: "Pref Max Distance", type: "number" },
  { key: "prefAgeMin", label: "Pref Age Min", type: "number" },
  { key: "prefAgeMax", label: "Pref Age Max", type: "number" },
  { key: "prefHeightMin", label: "Pref Height Min", type: "number" },
  { key: "prefHeightMax", label: "Pref Height Max", type: "number" },
  { key: "prefInterests", label: "Pref Interests (Any)", type: "array", placeholder: "travel, sports" },
  { key: "prefLanguages", label: "Pref Languages (Any)", type: "array", placeholder: "english, spanish" },
  { key: "prefZodiac", label: "Pref Zodiac (Any)", type: "array", placeholder: "aries, taurus" },
  { key: "prefPersonality", label: "Pref Personality (Any)", type: "array", placeholder: "intj, enfp" },
  { key: "prefDiet", label: "Pref Diet (Any)", type: "array", placeholder: "veg, non-veg" },
  { key: "prefReligion", label: "Pref Religion (Any)", type: "array", placeholder: "hindu, christian" },
  { key: "prefDrinking", label: "Pref Drinking (Any)", type: "array", placeholder: "never, socially" },
  { key: "prefSmoking", label: "Pref Smoking (Any)", type: "array", placeholder: "never, occasionally" },
  { key: "prefPets", label: "Pref Pets (Any)", type: "array", placeholder: "dog, cat" },
];

const toDisplayValue = (value: unknown) => {
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

type ParseResult =
  | { ok: true; value: string | number | boolean | string[] }
  | { ok: false; error: string };

const parseFilterValue = (type: FilterFieldType, value: string): ParseResult => {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: "Value is required." };

  if (type === "boolean") {
    if (trimmed !== "true" && trimmed !== "false") {
      return { ok: false, error: "Boolean value must be true or false." };
    }
    return { ok: true, value: trimmed === "true" };
  }

  if (type === "number") {
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return { ok: false, error: "Number value is invalid." };
    }
    return { ok: true, value: parsed };
  }

  if (type === "array") {
    const items = trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!items.length) {
      return { ok: false, error: "Array value needs at least one item." };
    }
    return { ok: true, value: items };
  }

  return { ok: true, value: trimmed };
};

type Props = {
  filters: AdminUserFilters;
  onChange: (filters: AdminUserFilters) => void;
  error?: string;
};

export default function FilterQueryBuilder({ filters, onChange, error = "" }: Props) {
  const [selectedKey, setSelectedKey] = useState(FILTER_FIELDS[0].key);
  const [inputValue, setInputValue] = useState("");
  const [localError, setLocalError] = useState("");

  const selectedField = useMemo(
    () => FILTER_FIELDS.find((field) => field.key === selectedKey) || FILTER_FIELDS[0],
    [selectedKey],
  );

  const applyFilter = () => {
    setLocalError("");
    const parsed = parseFilterValue(selectedField.type, inputValue);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }

    onChange({
      ...filters,
      [selectedField.key]: parsed.value,
    });
    setInputValue(selectedField.type === "boolean" ? "true" : "");
  };

  const removeFilter = (key: string) => {
    const next = { ...filters };
    delete next[key];
    onChange(next);
  };

  const clearAll = () => {
    onChange({});
    setLocalError("");
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label className="text-sm font-medium">Filter Users (Query Builder)</Label>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div>
          <Label>Field</Label>
          <select
            value={selectedKey}
            onChange={(event) => {
              const nextKey = event.target.value;
              const nextField = FILTER_FIELDS.find((field) => field.key === nextKey);
              setSelectedKey(nextKey);
              setInputValue(nextField?.type === "boolean" ? "true" : "");
              setLocalError("");
            }}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
          >
            {FILTER_FIELDS.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Label>Value</Label>
          {selectedField.type === "boolean" ? (
            <select
              value={inputValue || "true"}
              onChange={(event) => setInputValue(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <Input
              type={selectedField.type === "number" ? "number" : "text"}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={
                selectedField.placeholder ||
                (selectedField.type === "array" ? "comma separated values" : "value")
              }
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={applyFilter}>
          Add/Update Filter
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={clearAll}
          disabled={Object.keys(filters).length === 0}
        >
          Clear All
        </Button>
      </div>
      {localError ? <p className="text-sm text-error">{localError}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}

      {Object.keys(filters).length > 0 ? (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border p-2">
          {Object.entries(filters).map(([key, value]) => {
            const label = FILTER_FIELDS.find((field) => field.key === key)?.label || key;
            return (
              <div key={key} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{label}:</span>{" "}
                  <span className="text-muted-foreground break-all">{toDisplayValue(value)}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeFilter(key)}>
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No filters added yet.</p>
      )}
    </div>
  );
}
