"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AdminMobileConfig,
  getAdminMobileConfig,
  patchAdminMobileConfig,
} from "@/lib/admin-api";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbComp from "../layout/shared/breadcrumb/BreadcrumbComp";

type ConfigKey = keyof AdminMobileConfig;

type ConfigField = {
  key: ConfigKey;
  label: string;
  placeholder: string;
  required?: boolean;
  isUrl?: boolean;
};

type ConfigSection = {
  title: string;
  keys: ConfigKey[];
};

type FieldErrors = Partial<Record<ConfigKey, string>>;

const BCrumb = [{ to: "/", title: "home" }, { title: "app config" }];

const configFields: ConfigField[] = [
  {
    key: "BASE_URL",
    label: "Base API URL",
    placeholder: "https://api.lumore.xyz",
    required: true,
    isUrl: true,
  },
  {
    key: "SOCKET_URL",
    label: "Socket URL",
    placeholder: "https://api.lumore.xyz/api/chat",
    required: true,
    isUrl: true,
  },
  {
    key: "GOOGLE_WEB_CLIENT_ID",
    label: "Google Web Client ID",
    placeholder: "Google OAuth web client ID",
  },
  {
    key: "IOS_URL_SCHEMA",
    label: "iOS URL Schema",
    placeholder: "com.googleusercontent.apps.xxxxx",
  },
  {
    key: "ONESIGNAL_APP_ID",
    label: "OneSignal App ID",
    placeholder: "OneSignal app id",
  },
  {
    key: "ADMOB_ANDROID_INTERSTITIAL_ID",
    label: "AdMob Android Interstitial ID",
    placeholder: "ca-app-pub-xxx/yyy",
  },
  {
    key: "ADMOB_IOS_INTERSTITIAL_ID",
    label: "AdMob iOS Interstitial ID",
    placeholder: "ca-app-pub-xxx/yyy",
  },
  {
    key: "ADMOB_ANDROID_REWARDED_UNIT_ID",
    label: "AdMob Android Rewarded ID",
    placeholder: "ca-app-pub-xxx/yyy",
  },
  {
    key: "ADMOB_IOS_REWARDED_UNIT_ID",
    label: "AdMob iOS Rewarded ID",
    placeholder: "ca-app-pub-xxx/yyy",
  },
  {
    key: "PLAYSTORE_URL",
    label: "Play Store URL",
    placeholder: "https://play.google.com/store/apps/details?id=...",
    isUrl: true,
  },
  {
    key: "APPSTORE_URL",
    label: "App Store URL",
    placeholder: "https://apps.apple.com/app/...",
    isUrl: true,
  },
];

const configSections: ConfigSection[] = [
  {
    title: "Core Endpoints",
    keys: ["BASE_URL", "SOCKET_URL"],
  },
  {
    title: "Auth & Push",
    keys: ["GOOGLE_WEB_CLIENT_ID", "IOS_URL_SCHEMA", "ONESIGNAL_APP_ID"],
  },
  {
    title: "Ad Units",
    keys: [
      "ADMOB_ANDROID_INTERSTITIAL_ID",
      "ADMOB_IOS_INTERSTITIAL_ID",
      "ADMOB_ANDROID_REWARDED_UNIT_ID",
      "ADMOB_IOS_REWARDED_UNIT_ID",
    ],
  },
  {
    title: "Store Links",
    keys: ["PLAYSTORE_URL", "APPSTORE_URL"],
  },
];

const emptyConfig = (): AdminMobileConfig => ({
  BASE_URL: "",
  SOCKET_URL: "",
  GOOGLE_WEB_CLIENT_ID: "",
  IOS_URL_SCHEMA: "",
  ONESIGNAL_APP_ID: "",
  ADMOB_ANDROID_INTERSTITIAL_ID: "",
  ADMOB_IOS_INTERSTITIAL_ID: "",
  ADMOB_ANDROID_REWARDED_UNIT_ID: "",
  ADMOB_IOS_REWARDED_UNIT_ID: "",
  PLAYSTORE_URL: "",
  APPSTORE_URL: "",
});

const configKeyList = configFields.map((field) => field.key);

const fieldByKey = Object.fromEntries(
  configFields.map((field) => [field.key, field]),
) as Record<ConfigKey, ConfigField>;

const normalizeConfig = (input?: Partial<AdminMobileConfig> | null): AdminMobileConfig => {
  const next = emptyConfig();
  configKeyList.forEach((key) => {
    next[key] = String(input?.[key] || "").trim();
  });
  return next;
};

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validateConfig = (config: AdminMobileConfig): FieldErrors => {
  const errors: FieldErrors = {};

  configFields.forEach((field) => {
    const value = config[field.key];

    if (field.required && !value) {
      errors[field.key] = `${field.label} is required`;
      return;
    }

    if (field.isUrl && value && !isValidHttpUrl(value)) {
      errors[field.key] = `${field.label} must be a valid http/https URL`;
    }
  });

  return errors;
};

const buildPatch = (
  remoteConfig: AdminMobileConfig,
  draftConfig: AdminMobileConfig,
): Partial<AdminMobileConfig> => {
  const patch: Partial<AdminMobileConfig> = {};
  configKeyList.forEach((key) => {
    if (remoteConfig[key] !== draftConfig[key]) {
      patch[key] = draftConfig[key];
    }
  });
  return patch;
};

export default function AppConfigPage() {
  const [remoteConfig, setRemoteConfig] = useState<AdminMobileConfig>(emptyConfig());
  const [draftConfig, setDraftConfig] = useState<AdminMobileConfig>(emptyConfig());
  const [environment, setEnvironment] = useState("production");
  const [version, setVersion] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const hasChanges = useMemo(() => {
    const normalizedRemote = normalizeConfig(remoteConfig);
    const normalizedDraft = normalizeConfig(draftConfig);
    return configKeyList.some((key) => normalizedRemote[key] !== normalizedDraft[key]);
  }, [draftConfig, remoteConfig]);

  const loadConfig = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    try {
      const response = await getAdminMobileConfig();
      const nextConfig = normalizeConfig(response?.data?.config);
      setRemoteConfig(nextConfig);
      setDraftConfig(nextConfig);
      setEnvironment(response?.data?.environment || "production");
      setVersion(response?.data?.version || "");
      setUpdatedAt(response?.data?.updatedAt || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load app config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const setFieldValue = (key: ConfigKey, value: string) => {
    setDraftConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
    setSuccess("");
  };

  const resetDraft = () => {
    setDraftConfig(remoteConfig);
    setFieldErrors({});
    setError("");
    setSuccess("");
  };

  const saveConfig = async () => {
    setError("");
    setSuccess("");

    const normalizedRemote = normalizeConfig(remoteConfig);
    const normalizedDraft = normalizeConfig(draftConfig);
    const nextFieldErrors = validateConfig(normalizedDraft);
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      setError("Please fix validation errors before saving.");
      return;
    }

    const patch = buildPatch(normalizedRemote, normalizedDraft);
    if (!Object.keys(patch).length) {
      setSuccess("No changes to save.");
      return;
    }

    setSaving(true);
    try {
      const response = await patchAdminMobileConfig(patch);
      const nextConfig = normalizeConfig(response?.data?.config);
      setRemoteConfig(nextConfig);
      setDraftConfig(nextConfig);
      setEnvironment(response?.data?.environment || "production");
      setVersion(response?.data?.version || "");
      setUpdatedAt(response?.data?.updatedAt || "");
      setFieldErrors({});
      setSuccess("App config updated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save app config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="App Config" items={BCrumb} />
      <h1 className="text-2xl font-bold">App Config</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Mobile Runtime Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Environment: {environment}</span>
            <span>Version: {version || "-"}</span>
            <span>Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "-"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void loadConfig()} disabled={loading || saving}>
              Refresh
            </Button>
            <Button variant="outline" onClick={resetDraft} disabled={loading || saving}>
              Reset
            </Button>
            <Button onClick={() => void saveConfig()} disabled={loading || saving || !hasChanges}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}
          {loading ? <p>Loading...</p> : null}

          {!loading ? (
            <div className="space-y-4">
              {configSections.map((section) => (
                <Card key={section.title} className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {section.keys.map((key) => {
                        const field = fieldByKey[key];
                        const fieldError = fieldErrors[key];

                        return (
                          <div key={key} className="space-y-1">
                            <label className="text-sm font-medium" htmlFor={key}>
                              {field.label}
                              {field.required ? " *" : ""}
                            </label>
                            <Input
                              id={key}
                              value={draftConfig[key]}
                              onChange={(event) => setFieldValue(key, event.target.value)}
                              placeholder={field.placeholder}
                              disabled={saving}
                            />
                            {fieldError ? (
                              <p className="text-xs text-error">{fieldError}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
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
