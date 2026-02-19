"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminOptions, patchAdminOptions } from "@/lib/admin-api";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbComp from "../layout/shared/breadcrumb/BreadcrumbComp";

type OptionItem = {
  label: string;
  value: string;
};

type OptionsMap = Record<string, OptionItem[]>;

const BCrumb = [{ to: "/", title: "home" }, { title: "options" }];

const emptyItem = (): OptionItem => ({ label: "", value: "" });

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

  const loadOptions = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await getAdminOptions();
      const nextOptions = response?.data?.options || {};
      setRemoteOptions(nextOptions);
      setDraftOptions(
        Object.fromEntries(
          Object.entries(nextOptions).map(([key, items]) => [
            key,
            Array.isArray(items) ? items.map((item) => ({ ...item })) : [],
          ]),
        ),
      );
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

  const setRow = (groupKey: string, index: number, next: Partial<OptionItem>) => {
    setDraftOptions((prev) => {
      const list = [...(prev[groupKey] || [])];
      const current = list[index] || emptyItem();
      list[index] = { ...current, ...next };
      return { ...prev, [groupKey]: list };
    });
    setSuccess("");
  };

  const addRow = (groupKey: string) => {
    setDraftOptions((prev) => ({
      ...prev,
      [groupKey]: [...(prev[groupKey] || []), emptyItem()],
    }));
    setSuccess("");
  };

  const removeRow = (groupKey: string, index: number) => {
    setDraftOptions((prev) => {
      const list = [...(prev[groupKey] || [])];
      list.splice(index, 1);
      return { ...prev, [groupKey]: list };
    });
    setSuccess("");
  };

  const resetGroup = (groupKey: string) => {
    setDraftOptions((prev) => ({
      ...prev,
      [groupKey]: (remoteOptions[groupKey] || []).map((item) => ({ ...item })),
    }));
    setSuccess("");
  };

  const hasChanges = useMemo(
    () => JSON.stringify(draftOptions) !== JSON.stringify(remoteOptions),
    [draftOptions, remoteOptions],
  );

  const saveAll = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: OptionsMap = Object.fromEntries(
        Object.entries(draftOptions).map(([key, items]) => [
          key,
          (items || [])
            .map((item) => ({
              label: String(item?.label || "").trim(),
              value: String(item?.value || "").trim(),
            }))
            .filter((item) => item.label && item.value),
        ]),
      );

      const response = await patchAdminOptions(payload);
      const nextOptions = response?.data?.options || {};
      setRemoteOptions(nextOptions);
      setDraftOptions(
        Object.fromEntries(
          Object.entries(nextOptions).map(([key, items]) => [
            key,
            Array.isArray(items) ? items.map((item) => ({ ...item })) : [],
          ]),
        ),
      );
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
            <span>Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadOptions()} disabled={loading || saving}>
              Refresh
            </Button>
            <Button onClick={() => void saveAll()} disabled={loading || saving || !hasChanges}>
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}
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
                      <div key={`${groupKey}-${index}`} className="grid grid-cols-12 gap-2">
                        <Input
                          value={item?.label || ""}
                          onChange={(event) =>
                            setRow(groupKey, index, { label: event.target.value })
                          }
                          placeholder="Label"
                          className="col-span-5"
                          disabled={saving}
                        />
                        <Input
                          value={item?.value || ""}
                          onChange={(event) =>
                            setRow(groupKey, index, { value: event.target.value })
                          }
                          placeholder="Value"
                          className="col-span-5"
                          disabled={saving}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="col-span-2"
                          onClick={() => removeRow(groupKey, index)}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </div>
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
