"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminOptions, patchAdminOptions } from "@/lib/admin-api";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbComp from "../layout/shared/breadcrumb/BreadcrumbComp";
import { OptionRow, type OptionRowItem } from "./OptionRow";

type OptionsMap = Record<string, OptionRowItem[]>;

const BCrumb = [{ to: "/", title: "home" }, { title: "options" }];

const emptyItem = (): OptionRowItem => ({ label: "", value: "" });

const sanitizeDraftItem = (item: OptionRowItem): OptionRowItem | null => {
  const label = String(item.label || "").trim();
  const value = String(item.value || "").trim();
  if (!label || !value) return null;
  const next: OptionRowItem = { label, value };
  if (item.icon?.library && item.icon?.name) {
    next.icon = {
      library: item.icon.library,
      name: item.icon.name,
    };
  }
  return next;
};

const buildSavePayload = (draft: OptionsMap): OptionsMap => {
  const payload: OptionsMap = {};
  for (const [key, items] of Object.entries(draft)) {
    const cleaned = (items || [])
      .map(sanitizeDraftItem)
      .filter((item): item is OptionRowItem => item !== null);
    if (cleaned.length) payload[key] = cleaned;
  }
  return payload;
};

const cloneRemoteOptions = (response: unknown): OptionsMap => {
  const options = (response as { options?: Record<string, unknown> })?.options;
  if (!options || typeof options !== "object") return {};
  const cloned: OptionsMap = {};
  for (const [key, items] of Object.entries(options)) {
    if (!Array.isArray(items)) continue;
    cloned[key] = items.map((raw) => {
      const item = raw as Partial<OptionRowItem> & {
        icon?: { library?: unknown; name?: unknown };
      };
      const next: OptionRowItem = {
        label: String(item?.label || ""),
        value: String(item?.value || ""),
      };
      if (
        item?.icon &&
        typeof item.icon.library === "string" &&
        typeof item.icon.name === "string"
      ) {
        next.icon = { library: item.icon.library, name: item.icon.name };
      }
      return next;
    });
  }
  return cloned;
};

const isSameOptionsMap = (a: OptionsMap, b: OptionsMap) =>
  JSON.stringify(a) === JSON.stringify(b);

export default function OptionsPage() {
  const [remoteOptions, setRemoteOptions] = useState<OptionsMap>({});
  const [draftOptions, setDraftOptions] = useState<OptionsMap>({});
  const [version, setVersion] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const optionKeys = useMemo(
    () => Object.keys(draftOptions).sort((a, b) => a.localeCompare(b)),
    [draftOptions],
  );

  const applyServerOptions = (serverResponse: unknown) => {
    const next = cloneRemoteOptions(serverResponse);
    setRemoteOptions(next);
    setDraftOptions(next);
  };

  const loadOptions = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await getAdminOptions();
      applyServerOptions(response?.data);
      setVersion(response?.data?.version || "");
      setUpdatedAt(response?.data?.updatedAt || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load options");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  const clearTransientMessages = () => setSuccess("");

  const updateRow = (
    groupKey: string,
    index: number,
    next: Partial<OptionRowItem>,
  ) => {
    setDraftOptions((prev) => {
      const list = [...(prev[groupKey] || [])];
      const current = list[index] || emptyItem();
      list[index] = { ...current, ...next };
      return { ...prev, [groupKey]: list };
    });
    clearTransientMessages();
  };

  const addRow = (groupKey: string) => {
    setDraftOptions((prev) => ({
      ...prev,
      [groupKey]: [...(prev[groupKey] || []), emptyItem()],
    }));
    clearTransientMessages();
  };

  const removeRow = (groupKey: string, index: number) => {
    setDraftOptions((prev) => {
      const list = [...(prev[groupKey] || [])];
      list.splice(index, 1);
      return { ...prev, [groupKey]: list };
    });
    clearTransientMessages();
  };

  const resetGroup = (groupKey: string) => {
    setDraftOptions((prev) => ({
      ...prev,
      [groupKey]: (remoteOptions[groupKey] || []).map((item) => ({ ...item })),
    }));
    clearTransientMessages();
  };

  const hasChanges = !isSameOptionsMap(draftOptions, remoteOptions);

  const saveAll = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await patchAdminOptions(buildSavePayload(draftOptions));
      applyServerOptions(response?.data);
      setVersion(response?.data?.version || "");
      setUpdatedAt(response?.data?.updatedAt || "");
      setSuccess("Options updated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save options");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="Options" items={BCrumb} />
      <h1 className="text-2xl font-bold">Dynamic Options</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage App Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Version: {version || "-"}</span>
            <span>
              Updated:{" "}
              {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void loadOptions()}
              disabled={loading || saving}
            >
              Refresh
            </Button>
            <Button
              onClick={() => void saveAll()}
              disabled={loading || saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}
          {success ? (
            <p className="text-sm text-green-600">{success}</p>
          ) : null}
          {loading ? <p>Loading...</p> : null}

          {!loading ? (
            <div className="space-y-4">
              {optionKeys.map((groupKey) => (
                <Card key={groupKey} className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between gap-2">
                      <span>{groupKey}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetGroup(groupKey)}
                          disabled={saving}
                        >
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addRow(groupKey)}
                          disabled={saving}
                        >
                          Add Row
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(draftOptions[groupKey] || []).map((item, index) => (
                      <OptionRow
                        key={`${groupKey}-${index}`}
                        item={item}
                        disabled={saving}
                        onChange={(next) => updateRow(groupKey, index, next)}
                        onRemove={() => removeRow(groupKey, index)}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
