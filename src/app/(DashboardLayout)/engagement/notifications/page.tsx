"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  getAdminCampaignConfig,
  getUserGroups,
  sendAdminCampaign,
} from "@/lib/admin-api";
import { useEffect, useMemo, useState } from "react";
import BreadcrumbComp from "../../layout/shared/breadcrumb/BreadcrumbComp";

type GroupOption = {
  _id: string;
  name: string;
  memberCount?: number;
};

const BCrumb = [{ to: "/", title: "home" }, { title: "engagement notifications" }];
const PLACEHOLDER_HELP = "{nickname}, {realname}, {age}, {username}, {email}";

const parseCsv = (input: string) =>
  Array.from(
    new Set(
      input
        .split(/[\n,]+/g)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export default function AdminNotificationsPage() {
  const [channel, setChannel] = useState<"push" | "email">("push");
  const [emailCampaignType, setEmailCampaignType] = useState<"campaign" | "personalized">(
    "personalized",
  );
  const [targetType, setTargetType] = useState<"all" | "users" | "groups">("all");
  const [fromEmail, setFromEmail] = useState("");
  const [fromEmailOptions, setFromEmailOptions] = useState<string[]>([]);
  const [fromName, setFromName] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [replyToName, setReplyToName] = useState("");
  const [title, setTitle] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [body, setBody] = useState("");
  const [userIdsOrNames, setUserIdsOrNames] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const [groupsResponse, campaignConfigResponse] = await Promise.all([
          getUserGroups(),
          getAdminCampaignConfig(),
        ]);
        setGroups((groupsResponse?.data || []).map((group) => ({
          _id: group._id,
          name: group.name,
          memberCount: group.memberCount || 0,
        })));
        const options = campaignConfigResponse?.data?.fromEmails || [];
        setFromEmailOptions(options);
        if (options.length > 0) {
          setFromEmail(options[0]);
        }
      } catch {
        setGroups([]);
        setFromEmailOptions([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    void loadGroups();
  }, []);

  const parsedUsers = useMemo(() => parseCsv(userIdsOrNames), [userIdsOrNames]);

  const handleSend = async () => {
    setError("");
    setSuccess("");

    if (!body.trim()) {
      setError("Message body is required.");
      return;
    }
    if (channel === "push" && !title.trim()) {
      setError("Push title is required.");
      return;
    }
    if (targetType === "users" && parsedUsers.length === 0) {
      setError("Add at least one user id or username.");
      return;
    }
    if (targetType === "groups" && selectedGroupIds.length === 0) {
      setError("Select at least one group.");
      return;
    }

    setSending(true);
    try {
      const values = parsedUsers;
      const userIds = values.filter((value) => /^[a-fA-F0-9]{24}$/.test(value));
      const usernames = values.filter((value) => !/^[a-fA-F0-9]{24}$/.test(value));

      const response = await sendAdminCampaign({
        channel,
        targetType,
        emailCampaignType: channel === "email" ? emailCampaignType : undefined,
        fromEmail: channel === "email" ? fromEmail.trim() || undefined : undefined,
        fromName: channel === "email" ? fromName.trim() || undefined : undefined,
        replyToEmail: channel === "email" ? replyToEmail.trim() || undefined : undefined,
        replyToName: channel === "email" ? replyToName.trim() || undefined : undefined,
        title: title.trim() || undefined,
        emailSubject: emailSubject.trim() || undefined,
        body: body.trim(),
        userIds,
        usernames,
        groupIds: selectedGroupIds,
      });

      setSuccess(
        `Campaign sent successfully${response?.data?.recipientCount ? ` to ${response.data.recipientCount} users` : ""}.`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="Notifications" items={BCrumb} />
      <h1 className="text-2xl font-bold">Send Notifications / Emails</h1>
      <Card>
        <CardHeader>
          <CardTitle>Campaign Composer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Channel</Label>
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value as "push" | "email")}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="push">Push Notification</option>
                <option value="email">Email (Nodemailer)</option>
              </select>
            </div>
            <div>
              <Label>Target</Label>
              <select
                value={targetType}
                onChange={(event) =>
                  setTargetType(event.target.value as "all" | "users" | "groups")
                }
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="all">All Users</option>
                <option value="users">Specific Users</option>
                <option value="groups">User Group(s)</option>
              </select>
            </div>
          </div>

          <div>
            <Label>{channel === "push" ? "Title" : "Default Subject"}</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={channel === "push" ? "Notification title" : "Email subject fallback"}
            />
            {channel !== "email" || emailCampaignType === "personalized" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Supports placeholders: {PLACEHOLDER_HELP}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Shared campaign mode sends one same subject to all selected emails.
              </p>
            )}
          </div>

          {channel === "email" ? (
            <div className="space-y-3">
              <div>
                <Label>Email Campaign Type</Label>
                <select
                  value={emailCampaignType}
                  onChange={(event) =>
                    setEmailCampaignType(event.target.value as "campaign" | "personalized")
                  }
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                >
                  <option value="campaign">Email Campaign (same for everyone)</option>
                  <option value="personalized">Personalized Email Campaign</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>From Email</Label>
                  <select
                    value={fromEmail}
                    onChange={(event) => setFromEmail(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                  >
                    {fromEmailOptions.length === 0 ? (
                      <option value="">Default sender (env)</option>
                    ) : null}
                    {fromEmailOptions.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1">
                    <Link
                      href="/engagement/from-emails"
                      className="text-xs text-primary hover:underline"
                    >
                      Manage from emails
                    </Link>
                  </div>
                </div>
                <div>
                  <Label>From Name (Optional)</Label>
                  <Input
                    value={fromName}
                    onChange={(event) => setFromName(event.target.value)}
                    placeholder="Lumore Team"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Reply-To Email (Optional)</Label>
                  <Input
                    value={replyToEmail}
                    onChange={(event) => setReplyToEmail(event.target.value)}
                    placeholder="support@yourdomain.com"
                  />
                </div>
                <div>
                  <Label>Reply-To Name (Optional)</Label>
                  <Input
                    value={replyToName}
                    onChange={(event) => setReplyToName(event.target.value)}
                    placeholder="Support Team"
                  />
                </div>
              </div>
              <Label>Email Subject (Optional)</Label>
              <Input
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
                placeholder="Custom email subject"
              />
              {emailCampaignType === "personalized" ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports placeholders: {PLACEHOLDER_HELP}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Shared campaign mode sends one same subject to all selected emails.
                </p>
              )}
            </div>
          ) : null}

          <div>
            <Label>Message</Label>
            <Textarea
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write notification/email message..."
            />
            {channel !== "email" || emailCampaignType === "personalized" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Supports placeholders: {PLACEHOLDER_HELP}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Shared campaign mode sends one same message to all selected emails.
              </p>
            )}
          </div>

          {targetType === "users" ? (
            <div>
              <Label>User IDs or Usernames (comma/newline separated)</Label>
              <Textarea
                rows={4}
                value={userIdsOrNames}
                onChange={(event) => setUserIdsOrNames(event.target.value)}
                placeholder="64f... , alice_username"
              />
            </div>
          ) : null}

          {targetType === "groups" ? (
            <div className="space-y-2">
              <Label>Select Groups</Label>
              <div className="max-h-56 overflow-y-auto rounded-md border p-2 space-y-2">
                {loadingGroups ? <p className="text-sm">Loading groups...</p> : null}
                {!loadingGroups && groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups available.</p>
                ) : null}
                {groups.map((group) => {
                  const checked = selectedGroupIds.includes(group._id);
                  return (
                    <label key={group._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedGroupIds((prev) =>
                            event.target.checked
                              ? [...prev, group._id]
                              : prev.filter((id) => id !== group._id),
                          );
                        }}
                      />
                      <span>
                        {group.name} ({group.memberCount || 0} members)
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-error">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}

          <Button onClick={() => void handleSend()} disabled={sending}>
            {sending ? "Sending..." : "Send Campaign"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
