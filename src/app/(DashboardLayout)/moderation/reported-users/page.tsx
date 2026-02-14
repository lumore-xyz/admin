"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReportedUsers, updateReportedUserStatus } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import BreadcrumbComp from "../../layout/shared/breadcrumb/BreadcrumbComp";

type ReportRow = {
  _id: string;
  category: string;
  reason?: string;
  details?: string;
  status: "open" | "reviewing" | "closed";
  createdAt: string;
  reporter?: {
    _id?: string;
    username?: string;
    realName?: string;
    profilePicture?: string;
    email?: string;
  };
  reportedUser?: {
    _id?: string;
    username?: string;
    realName?: string;
    profilePicture?: string;
    email?: string;
    isArchived?: boolean;
    isActive?: boolean;
  };
  roomId?: {
    _id?: string;
  };
};

type Pagination = {
  page: number;
  hasMore: boolean;
};

const BCrumb = [{ to: "/", title: "home" }, { title: "reported users" }];

export default function ReportedUsersPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "reviewing" | "closed"
  >("all");
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const load = async (requestedPage = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await getReportedUsers({
        page: requestedPage,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRows(res.data || []);
      setPagination(
        res.pagination
          ? { page: res.pagination.page, hasMore: res.pagination.hasMore }
          : null,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const onUpdateStatus = async (
    reportId: string,
    status: "open" | "reviewing" | "closed",
  ) => {
    try {
      await updateReportedUserStatus(reportId, status);
      load(page);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update report status",
      );
    }
  };

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="Reported Users" items={BCrumb} />
      <h1 className="text-2xl font-bold">Reported Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Reports Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2 max-w-xs">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(1);
                setStatusFilter(
                  value as "all" | "open" | "reviewing" | "closed",
                );
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-sm text-error mb-2">{error}</p> : null}
          {loading ? <p>Loading...</p> : null}

          {!loading ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.reportedUser?.profilePicture ? (
                            <img
                              src={row.reportedUser.profilePicture}
                              alt={row.reportedUser.username || "reported user"}
                              className="size-9 rounded-full object-cover"
                            />
                          ) : null}
                          <div>
                            <p className="font-medium">
                              {row.reportedUser?.username || "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.reportedUser?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {row.reporter?.username || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.reporter?.email || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="lightWarning">
                          {row.category || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="truncate">
                          {row.reason || row.details || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === "closed"
                              ? "lightSuccess"
                              : row.status === "reviewing"
                                ? "lightInfo"
                                : "lightError"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateStatus(row._id, "open")}
                          >
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateStatus(row._id, "reviewing")}
                          >
                            Reviewing
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onUpdateStatus(row._id, "closed")}
                          >
                            Close
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

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
