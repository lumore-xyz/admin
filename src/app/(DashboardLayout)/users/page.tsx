"use client";

import DataTable from "@/app/components/utilities/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminUsers, updateUserArchive } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import BreadcrumbComp from "../layout/shared/breadcrumb/BreadcrumbComp";

type AdminUser = {
  _id: string;
  username: string;
  realName?: string;
  profilePicture?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  dob?: string;
  work?: string;
  institution?: string;
  maritalStatus?: string;
  religion?: string;
  hometown?: string;
  languages?: string[];
  isArchived?: boolean;
  isActive?: boolean;
  credits?: number;
  createdAt?: string;
  verificationStatus?: string;
  isAdmin?: boolean;
  [key: string]: unknown;
};

type Pagination = {
  page: number;
  hasMore: boolean;
};

const BCrumb = [
  {
    to: "/",
    title: "users",
  },
];

export default function UsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState("");

  const load = async (requestedPage = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUsers({
        page: requestedPage,
        limit: 20,
        search,
      });
      setRows(res.data || []);
      setPagination(
        res.pagination
          ? { page: res.pagination.page, hasMore: res.pagination.hasMore }
          : null,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onToggleArchive = async (userId: string, isArchived = false) => {
    try {
      await updateUserArchive(userId, !isArchived);
      load(page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const orderedKeys: Array<keyof AdminUser> = [
    "_id",
    "username",
    "realName",
    "email",
    "phoneNumber",
    "gender",
    "dob",
    "work",
    "institution",
    "maritalStatus",
    "religion",
    "hometown",
    "languages",
    "isArchived",
    "isActive",
    "credits",
    "createdAt",
    "verificationStatus",
  ];

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const normalizedRows = rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    orderedKeys.forEach((key) => {
      if (key === "username") {
        normalized[key] = {
          avatar: row.profilePicture || "",
          name: row.username || "-",
        };
        return;
      }
      if (key === "realName") {
        normalized[key] = {
          avatar: row.profilePicture || "",
          name: row.realName || "-",
        };
        return;
      }
      if (key === "languages") {
        normalized[key] = Array.isArray(row.languages)
          ? row.languages.join(", ")
          : "-";
        return;
      }
      if (key === "dob" || key === "createdAt") {
        normalized[key] = formatDate(String(row[key] || ""));
        return;
      }
      normalized[key] = row[key] ?? "-";
    });
    return normalized;
  });

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="Registered Users" items={BCrumb} />
      <h1 className="text-2xl font-bold">Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username/email"
            />
            <Button
              onClick={() => {
                setPage(1);
                load(1);
              }}
            >
              Search
            </Button>
          </div>
          {error ? <p className="text-sm text-error mb-2">{error}</p> : null}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <DataTable
              data={normalizedRows}
              title="Users Data Table"
              searchPlaceholder="Search users by any property..."
              downloadFileName="lumore-users.csv"
              showPagination={false}
              renderActions={(row) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onToggleArchive(
                      String(row._id || ""),
                      row.isArchived === true,
                    )
                  }
                >
                  {row.isArchived === true ? "Unarchive" : "Archive"}
                </Button>
              )}
            />
          )}
          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination?.page || page}
            </span>
            <Button
              variant="outline"
              disabled={!pagination?.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
