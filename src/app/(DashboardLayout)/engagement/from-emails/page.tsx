"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminOptions, patchAdminOptions } from "@/lib/admin-api";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbComp from "../../layout/shared/breadcrumb/BreadcrumbComp";

type OptionItem = {
  label: string;
  value: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCrumb = [{ to: "/", title: "home" }, { title: "engagement from emails" }];

const emptyRow = (): OptionItem => ({ label: "", value: "" });

export default function EngagementFromEmailsPage() {
  const [rows, setRows] = useState<OptionItem[]>([]);
  const [remoteRows, setRemoteRows] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFromEmails = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await getAdminOptions();
      const incoming = Array.isArray(response?.data?.options?.campaignFromEmailOptions)
        ? response.data.options.campaignFromEmailOptions
        : [];
      const normalized = incoming
        .map((item) => ({
          label: String(item?.label || "").trim(),
          value: String(item?.value || "").trim().toLowerCase(),
        }))
        .filter((item) => item.value);

      setRows(normalized);
      setRemoteRows(normalized);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load sender emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFromEmails();
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(remoteRows),
    [rows, remoteRows],
  );

  const setRow = (index: number, next: Partial<OptionItem>) => {
    setRows((prev) => {
      const list = [...prev];
      const current = list[index] || emptyRow();
      list[index] = { ...current, ...next };
      return list;
    });
    setSuccess("");
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
    setSuccess("");
  };

  const removeRow = (index: number) => {
    setRows((prev) => {
      const list = [...prev];
      list.splice(index, 1);
      return list;
    });
    setSuccess("");
  };

  const saveRows = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const seen = new Set<string>();
      const payloadRows: OptionItem[] = [];

      for (const row of rows) {
        const email = String(row?.value || "").trim().toLowerCase();
        const label = String(row?.label || "").trim();
        if (!email && !label) continue;
        if (!EMAIL_PATTERN.test(email)) {
          throw new Error(`Invalid email: ${email || "(empty)"}`);
        }
        if (seen.has(email)) continue;
        seen.add(email);
        payloadRows.push({
          label: label || email,
          value: email,
        });
      }

      const response = await patchAdminOptions({
        campaignFromEmailOptions: payloadRows,
      });

      const saved = Array.isArray(response?.data?.options?.campaignFromEmailOptions)
        ? response.data.options.campaignFromEmailOptions
        : [];

      const normalized = saved
        .map((item) => ({
          label: String(item?.label || "").trim(),
          value: String(item?.value || "").trim().toLowerCase(),
        }))
        .filter((item) => item.value);

      setRows(normalized);
      setRemoteRows(normalized);
      setSuccess("From email list updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save sender emails");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="From Emails" items={BCrumb} />
      <h1 className="text-2xl font-bold">Manage Campaign From Emails</h1>
      <Card>
        <CardHeader>
          <CardTitle>From Email List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These emails appear in Engagement {'->'} Send Campaign {'->'} From Email dropdown.
          </p>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadFromEmails()} disabled={loading || saving}>
              Refresh
            </Button>
            <Button variant="outline" onClick={addRow} disabled={loading || saving}>
              Add Email
            </Button>
            <Button onClick={() => void saveRows()} disabled={loading || saving || !hasChanges}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}
          {loading ? <p>Loading...</p> : null}

          {!loading ? (
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={`from-email-${index}`} className="grid grid-cols-12 gap-2">
                  <Input
                    value={row.label}
                    onChange={(event) => setRow(index, { label: event.target.value })}
                    placeholder="Label (optional)"
                    className="col-span-4"
                    disabled={saving}
                  />
                  <Input
                    value={row.value}
                    onChange={(event) => setRow(index, { value: event.target.value })}
                    placeholder="email@domain.com"
                    className="col-span-6"
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-2"
                    onClick={() => removeRow(index)}
                    disabled={saving}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
