"use client";

import DataTable from "@/app/components/utilities/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminUsers, updateUserArchive } from "@/lib/admin-api";
import type { AdminUserFilters } from "@/lib/admin-api";
import { useEffect, useMemo, useState } from "react";
import FilterQueryBuilder from "../engagement/groups/FilterQueryBuilder";
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
  limit: number;
  total: number;
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
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminUserFilters>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState("");

  const load = async (
    requestedPage = page,
    requestedFilters: AdminUserFilters = filters,
  ) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUsers({
        page: requestedPage,
        limit,
        search,
        filters: Object.keys(requestedFilters).length ? requestedFilters : undefined,
      });
      setRows(res.data || []);
      setPagination(
        res.pagination
          ? {
              page: res.pagination.page,
              limit: res.pagination.limit,
              total: res.pagination.total,
              hasMore: res.pagination.hasMore,
            }
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
  }, [page, limit]);

  const totalPages = useMemo(() => {
    if (!pagination?.total || !pagination?.limit) return 1;
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

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
          <div className="mb-3 space-y-2">
            <FilterQueryBuilder filters={filters} onChange={setFilters} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPage(1);
                  load(1);
                }}
              >
                Apply Filters
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const nextFilters = {};
                  setFilters(nextFilters);
                  setPage(1);
                  void load(1, nextFilters);
                }}
                disabled={Object.keys(filters).length === 0}
              >
                Reset Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                Active filters: {Object.keys(filters).length}
              </span>
            </div>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!pagination?.hasMore || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              Page {pagination?.page || page} of {totalPages} (
              {pagination?.total ?? rows.length} users)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Users per page</span>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  const nextLimit = Number(value);
                  setLimit(nextLimit);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[90px]">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
