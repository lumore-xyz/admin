"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createUserGroup,
  getAdminUsers,
  getUserGroups,
  updateUserGroupMembers,
  type AdminUserFilters,
  type AdminUserGroup,
} from "@/lib/admin-api";
import { useEffect, useState } from "react";
import BreadcrumbComp from "../../layout/shared/breadcrumb/BreadcrumbComp";
import FilterQueryBuilder from "./FilterQueryBuilder";

const BCrumb = [{ to: "/", title: "home" }, { title: "user groups" }];

const parseCsv = (input: string) =>
  Array.from(
    new Set(
      input
        .split(/[\n,]+/g)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export default function UserGroupsPage() {
  const [groups, setGroups] = useState<AdminUserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupUsersInput, setGroupUsersInput] = useState("");
  const [createFilters, setCreateFilters] = useState<AdminUserFilters>({});
  const [createPreviewCount, setCreatePreviewCount] = useState<number | null>(null);
  const [previewingCreate, setPreviewingCreate] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [memberAction, setMemberAction] = useState<"add" | "remove" | "set">("add");
  const [memberInput, setMemberInput] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<
    Array<{ _id: string; username?: string; email?: string; realName?: string }>
  >([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [updateFilters, setUpdateFilters] = useState<AdminUserFilters>({});
  const [updatePreviewCount, setUpdatePreviewCount] = useState<number | null>(null);
  const [previewingUpdate, setPreviewingUpdate] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getUserGroups();
      setGroups(response?.data || []);
      if (!selectedGroupId && response?.data?.length) {
        setSelectedGroupId(response.data[0]._id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  useEffect(() => {
    const query = userSearch.trim();
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const response = await getAdminUsers({
          page: 1,
          limit: 20,
          search: query,
        });
        setUserSearchResults(response?.data || []);
      } catch {
        setUserSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [userSearch]);

  const handleCreateGroup = async () => {
    setError("");
    setSuccess("");
    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    setCreating(true);
    try {
      const values = parseCsv(groupUsersInput);
      const userIds = values.filter((value) => /^[a-fA-F0-9]{24}$/.test(value));
      const usernames = values.filter((value) => !/^[a-fA-F0-9]{24}$/.test(value));

      await createUserGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        userIds,
        usernames,
        filters: Object.keys(createFilters).length ? createFilters : undefined,
      });

      setGroupName("");
      setGroupDescription("");
      setGroupUsersInput("");
      setCreateFilters({});
      setCreatePreviewCount(null);
      setSuccess("Group created successfully.");
      await loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateMembers = async () => {
    setError("");
    setSuccess("");

    if (!selectedGroupId) {
      setError("Please select a group.");
      return;
    }

    const values = parseCsv(memberInput);
    const mergedExplicitIds = Array.from(new Set([...selectedUserIds, ...values]));
    if (!values.length && !selectedUserIds.length && !Object.keys(updateFilters).length) {
      setError("Please select users, provide user ids/usernames, or set filters.");
      return;
    }

    setUpdating(true);
    try {
      const userIds = mergedExplicitIds.filter((value) => /^[a-fA-F0-9]{24}$/.test(value));
      const usernames = mergedExplicitIds.filter((value) => !/^[a-fA-F0-9]{24}$/.test(value));
      await updateUserGroupMembers(selectedGroupId, {
        action: memberAction,
        userIds,
        usernames,
        filters: Object.keys(updateFilters).length ? updateFilters : undefined,
      });

      setMemberInput("");
      setSelectedUserIds([]);
      setUserSearch("");
      setUserSearchResults([]);
      setUpdateFilters({});
      setUpdatePreviewCount(null);
      setSuccess("Group members updated.");
      await loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update group members");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreatePreviewCount = async () => {
    setError("");
    if (!Object.keys(createFilters).length) {
      setCreatePreviewCount(0);
      return;
    }

    setPreviewingCreate(true);
    try {
      const response = await getAdminUsers({
        page: 1,
        limit: 1,
        filters: createFilters,
      });
      setCreatePreviewCount(response?.pagination?.total || 0);
    } catch (err: unknown) {
      setCreatePreviewCount(null);
      setError(err instanceof Error ? err.message : "Failed to preview users");
    } finally {
      setPreviewingCreate(false);
    }
  };

  const handleUpdatePreviewCount = async () => {
    setError("");
    if (!Object.keys(updateFilters).length) {
      setUpdatePreviewCount(0);
      return;
    }

    setPreviewingUpdate(true);
    try {
      const response = await getAdminUsers({
        page: 1,
        limit: 1,
        filters: updateFilters,
      });
      setUpdatePreviewCount(response?.pagination?.total || 0);
    } catch (err: unknown) {
      setUpdatePreviewCount(null);
      setError(err instanceof Error ? err.message : "Failed to preview users");
    } finally {
      setPreviewingUpdate(false);
    }
  };

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="User Groups" items={BCrumb} />
      <h1 className="text-2xl font-bold">Create & Manage User Groups</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Group Name</Label>
            <Input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="e.g. Verified users"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label>Initial Users (IDs/Usernames, comma/newline separated)</Label>
            <Textarea
              rows={3}
              value={groupUsersInput}
              onChange={(event) => setGroupUsersInput(event.target.value)}
              placeholder="64f..., alice_username"
            />
          </div>
          <div className="space-y-2">
            <FilterQueryBuilder filters={createFilters} onChange={setCreateFilters} />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCreatePreviewCount()}
                disabled={previewingCreate}
              >
                {previewingCreate ? "Previewing..." : "Preview Filter Count"}
              </Button>
              {createPreviewCount !== null ? (
                <p className="text-sm text-muted-foreground">
                  Matching users: {createPreviewCount}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Filters resolve users at submission time and store snapshot members.
            </p>
          </div>
          <Button onClick={() => void handleCreateGroup()} disabled={creating}>
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add/Remove Users in Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Group</Label>
              <select
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="">Select group</option>
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name} ({group.memberCount || 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Action</Label>
              <select
                value={memberAction}
                onChange={(event) =>
                  setMemberAction(event.target.value as "add" | "remove" | "set")
                }
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="add">Add Users</option>
                <option value="remove">Remove Users</option>
                <option value="set">Replace Members (Set)</option>
              </select>
            </div>
          </div>
          <div>
            <Label>User IDs or Usernames</Label>
            <Textarea
              rows={3}
              value={memberInput}
              onChange={(event) => setMemberInput(event.target.value)}
              placeholder="64f..., bob_username"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional manual input. You can also use DB search below.
            </p>
          </div>
          <div className="space-y-2">
            <FilterQueryBuilder filters={updateFilters} onChange={setUpdateFilters} />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleUpdatePreviewCount()}
                disabled={previewingUpdate}
              >
                {previewingUpdate ? "Previewing..." : "Preview Filter Count"}
              </Button>
              {updatePreviewCount !== null ? (
                <p className="text-sm text-muted-foreground">
                  Matching users: {updatePreviewCount}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Filters resolve users at submission time and apply against snapshot members.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Search Users in DB</Label>
            <Input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search by username or email..."
            />
            {searchingUsers ? <p className="text-sm">Searching users...</p> : null}
            {!searchingUsers && userSearch.trim().length >= 2 ? (
              <div className="max-h-56 overflow-y-auto rounded-md border p-2 space-y-2">
                {userSearchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found.</p>
                ) : null}
                {userSearchResults.map((user) => {
                  const checked = selectedUserIds.includes(user._id);
                  return (
                    <label key={user._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelectedUserIds((prev) =>
                            event.target.checked
                              ? [...prev, user._id]
                              : prev.filter((id) => id !== user._id),
                          );
                        }}
                      />
                      <span className="font-medium">{user.username || user.realName || user._id}</span>
                      <span className="text-muted-foreground">{user.email || ""}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
            {selectedUserIds.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Selected from search: {selectedUserIds.length}
              </p>
            ) : null}
          </div>
          <Button onClick={() => void handleUpdateMembers()} disabled={updating}>
            {updating ? "Updating..." : "Apply Member Update"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading groups...</p> : null}
          {!loading && groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups created yet.</p>
          ) : null}
          {!loading && groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group._id} className="rounded-md border p-3">
                  <p className="font-medium">{group.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.description || "No description"}
                  </p>
                  <p className="text-sm mt-1">
                    Members: {group.memberCount || group.members?.length || 0}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
    </div>
  );
}
