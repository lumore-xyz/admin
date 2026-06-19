"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminAppVersion,
  AdminAppVersionInput,
  AdminAppVersionPatch,
  AdminAppVersionPlatform,
  createAdminAppVersion,
  deleteAdminAppVersion,
  getAdminAppVersions,
  updateAdminAppVersion,
} from "@/lib/admin-api";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbComp from "../layout/shared/breadcrumb/BreadcrumbComp";

const BCrumb = [{ to: "/", title: "home" }, { title: "app version" }];

const PLATFORM_OPTIONS: { value: AdminAppVersionPlatform; label: string }[] = [
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
];

type FormState = {
  platform: AdminAppVersionPlatform;
  latestVersion: string;
  minimumSupportedVersion: string;
  forceUpdate: boolean;
  isActive: boolean;
  playStoreUrl: string;
  appStoreUrl: string;
  updateTitle: string;
  updateMessage: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm = (platform: AdminAppVersionPlatform = "android"): FormState => ({
  platform,
  latestVersion: "",
  minimumSupportedVersion: "",
  forceUpdate: false,
  isActive: true,
  playStoreUrl: "",
  appStoreUrl: "",
  updateTitle: "Update available",
  updateMessage:
    "A new version of the app is available. Please update for the best experience.",
});

const SEMVER_LIKE = /^\d+(\.\d+){0,3}([-+][0-9A-Za-z.-]+)?$/;

const isValidHttpUrl = (value: string) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validateForm = (
  form: FormState,
  { requirePlatform = true }: { requirePlatform?: boolean } = {},
): FormErrors => {
  const errors: FormErrors = {};

  if (requirePlatform && !form.platform) {
    errors.platform = "Platform is required";
  }

  if (!form.latestVersion.trim()) {
    errors.latestVersion = "Latest version is required";
  } else if (!SEMVER_LIKE.test(form.latestVersion.trim())) {
    errors.latestVersion = "Use a semantic-style version like 1.0.1";
  }

  if (!form.minimumSupportedVersion.trim()) {
    errors.minimumSupportedVersion = "Minimum supported version is required";
  } else if (!SEMVER_LIKE.test(form.minimumSupportedVersion.trim())) {
    errors.minimumSupportedVersion = "Use a semantic-style version like 1.0.1";
  }

  if (form.playStoreUrl && !isValidHttpUrl(form.playStoreUrl.trim())) {
    errors.playStoreUrl = "Play Store URL must be a valid http(s) URL";
  }

  if (form.appStoreUrl && !isValidHttpUrl(form.appStoreUrl.trim())) {
    errors.appStoreUrl = "App Store URL must be a valid http(s) URL";
  }

  return errors;
};

const toFormState = (doc: AdminAppVersion): FormState => ({
  platform: (doc.platform as AdminAppVersionPlatform) || "android",
  latestVersion: doc.latestVersion || "",
  minimumSupportedVersion: doc.minimumSupportedVersion || "",
  forceUpdate: Boolean(doc.forceUpdate),
  isActive: doc.isActive !== false,
  playStoreUrl: doc.playStoreUrl || "",
  appStoreUrl: doc.appStoreUrl || "",
  updateTitle: doc.updateTitle || "Update available",
  updateMessage:
    doc.updateMessage ||
    "A new version of the app is available. Please update for the best experience.",
});

const platformLabel = (platform: string) =>
  PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ||
  platform.toUpperCase();

const formatTimestamp = (value?: string) =>
  value ? new Date(value).toLocaleString() : "-";

export default function AppVersionPage() {
  const [configs, setConfigs] = useState<AdminAppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<AdminAppVersion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadConfigs = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await getAdminAppVersions();
      const next = Array.isArray(response?.data) ? response.data : [];
      setConfigs(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load app versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfigs();
  }, []);

  const existingPlatforms = useMemo(
    () => new Set(configs.map((config) => config.platform)),
    [configs],
  );

  const openCreateDialog = () => {
    const used = existingPlatforms;
    const nextPlatform: AdminAppVersionPlatform = used.has("android")
      ? used.has("ios")
        ? "android"
        : "ios"
      : "android";
    setEditingId(null);
    setForm(emptyForm(nextPlatform));
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (doc: AdminAppVersion) => {
    setEditingId(doc._id);
    setForm(toFormState(doc));
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingId(null);
    setFormErrors({});
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    setSuccess("");
  };

  const handleSubmit = async () => {
    const errors = validateForm(form, { requirePlatform: !editingId });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (editingId) {
        const payload: AdminAppVersionPatch = {
          latestVersion: form.latestVersion.trim(),
          minimumSupportedVersion: form.minimumSupportedVersion.trim(),
          forceUpdate: form.forceUpdate,
          isActive: form.isActive,
          playStoreUrl: form.playStoreUrl.trim(),
          appStoreUrl: form.appStoreUrl.trim(),
          updateTitle: form.updateTitle.trim(),
          updateMessage: form.updateMessage.trim(),
        };
        const response = await updateAdminAppVersion(editingId, payload);
        const updated = response?.data;
        setConfigs((prev) =>
          prev.map((item) => (item._id === editingId && updated ? updated : item)),
        );
        setSuccess("App version config updated.");
      } else {
        const payload: AdminAppVersionInput = {
          platform: form.platform,
          latestVersion: form.latestVersion.trim(),
          minimumSupportedVersion: form.minimumSupportedVersion.trim(),
          forceUpdate: form.forceUpdate,
          isActive: form.isActive,
          playStoreUrl: form.playStoreUrl.trim(),
          appStoreUrl: form.appStoreUrl.trim(),
          updateTitle: form.updateTitle.trim(),
          updateMessage: form.updateMessage.trim(),
        };
        const response = await createAdminAppVersion(payload);
        if (response?.data) {
          setConfigs((prev) => [response.data, ...prev]);
        }
        setSuccess("App version config created.");
      }
      setDialogOpen(false);
      setEditingId(null);
      await loadConfigs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save app version");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (doc: AdminAppVersion) => {
    setError("");
    setSuccess("");
    try {
      const response = await updateAdminAppVersion(doc._id, {
        isActive: !doc.isActive,
      });
      const updated = response?.data;
      if (updated) {
        setConfigs((prev) =>
          prev.map((item) => (item._id === doc._id ? updated : item)),
        );
      }
      setSuccess(
        `${platformLabel(doc.platform)} config ${
          updated?.isActive ? "enabled" : "disabled"
        }.`,
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update app version status",
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      await deleteAdminAppVersion(pendingDelete._id);
      setConfigs((prev) =>
        prev.filter((item) => item._id !== pendingDelete._id),
      );
      setSuccess(`${platformLabel(pendingDelete.platform)} config deleted.`);
      setPendingDelete(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete app version",
      );
    } finally {
      setDeleting(false);
    }
  };

  const isEditing = Boolean(editingId);

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="App Version" items={BCrumb} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">App Version Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure the latest and minimum supported versions shown to users in
            the mobile app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void loadConfigs()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>New Config</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}

      {loading ? <p>Loading...</p> : null}

      {!loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {configs.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No app version configs yet. Create one for Android or iOS to
                start showing update prompts.
              </CardContent>
            </Card>
          ) : null}
          {configs.map((config) => (
            <Card key={config._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">
                    {platformLabel(config.platform)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {config.isActive ? "Active" : "Disabled"}
                    </span>
                    <Switch
                      checked={Boolean(config.isActive)}
                      onCheckedChange={() => void handleToggleActive(config)}
                      aria-label="Toggle config active"
                    />
                  </div>
                </div>
                <CardDescription>
                  Updated {formatTimestamp(config.updatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Latest version</p>
                    <p className="font-medium">{config.latestVersion || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Minimum supported
                    </p>
                    <p className="font-medium">
                      {config.minimumSupportedVersion || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(config.forceUpdate)}
                    disabled
                    aria-label="Force update"
                  />
                  <span className="text-xs text-muted-foreground">
                    Force update {config.forceUpdate ? "on" : "off"}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Play Store URL</p>
                  <p className="break-all text-xs">
                    {config.playStoreUrl || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">App Store URL</p>
                  <p className="break-all text-xs">
                    {config.appStoreUrl || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Update title</p>
                  <p className="text-sm">{config.updateTitle || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Update message</p>
                  <p className="text-xs text-muted-foreground">
                    {config.updateMessage || "-"}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(config)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDelete(config)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit App Version Config" : "New App Version Config"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the version, copy, and store links shown in the mobile app."
                : "Configure the first version config for a platform."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="platform">Platform</Label>
              <select
                id="platform"
                value={form.platform}
                onChange={(event) =>
                  setField("platform", event.target.value as AdminAppVersionPlatform)
                }
                disabled={isEditing || saving}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={!isEditing && existingPlatforms.has(option.value)}
                  >
                    {option.label}
                    {!isEditing && existingPlatforms.has(option.value)
                      ? " (already configured)"
                      : ""}
                  </option>
                ))}
              </select>
              {formErrors.platform ? (
                <p className="text-xs text-error">{formErrors.platform}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="latestVersion">Latest version</Label>
                <Input
                  id="latestVersion"
                  value={form.latestVersion}
                  onChange={(event) => setField("latestVersion", event.target.value)}
                  placeholder="1.0.1"
                  disabled={saving}
                />
                {formErrors.latestVersion ? (
                  <p className="text-xs text-error">{formErrors.latestVersion}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="minimumSupportedVersion">
                  Minimum supported version
                </Label>
                <Input
                  id="minimumSupportedVersion"
                  value={form.minimumSupportedVersion}
                  onChange={(event) =>
                    setField("minimumSupportedVersion", event.target.value)
                  }
                  placeholder="1.0.1"
                  disabled={saving}
                />
                {formErrors.minimumSupportedVersion ? (
                  <p className="text-xs text-error">
                    {formErrors.minimumSupportedVersion}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Switch
                  id="forceUpdate"
                  checked={form.forceUpdate}
                  onCheckedChange={(value) => setField("forceUpdate", value)}
                  disabled={saving}
                />
                <Label htmlFor="forceUpdate">Force update</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(value) => setField("isActive", value)}
                  disabled={saving}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="playStoreUrl">Play Store URL</Label>
              <Input
                id="playStoreUrl"
                value={form.playStoreUrl}
                onChange={(event) => setField("playStoreUrl", event.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                disabled={saving}
              />
              {formErrors.playStoreUrl ? (
                <p className="text-xs text-error">{formErrors.playStoreUrl}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="appStoreUrl">App Store URL</Label>
              <Input
                id="appStoreUrl"
                value={form.appStoreUrl}
                onChange={(event) => setField("appStoreUrl", event.target.value)}
                placeholder="https://apps.apple.com/app/..."
                disabled={saving}
              />
              {formErrors.appStoreUrl ? (
                <p className="text-xs text-error">{formErrors.appStoreUrl}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="updateTitle">Update title</Label>
              <Input
                id="updateTitle"
                value={form.updateTitle}
                onChange={(event) => setField("updateTitle", event.target.value)}
                placeholder="Update available"
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="updateMessage">Update message</Label>
              <Textarea
                id="updateMessage"
                rows={4}
                value={form.updateMessage}
                onChange={(event) => setField("updateMessage", event.target.value)}
                placeholder="Tell users what's new..."
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (!open ? setPendingDelete(null) : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete app version config?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `This will permanently delete the ${platformLabel(
                    pendingDelete.platform,
                  )} config. Mobile users on that platform will no longer receive update prompts until a new config is created.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}