"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingQuestions, setQuestionStatus } from "@/lib/admin-api";
import { useEffect, useState } from "react";
import BreadcrumbComp from "../../layout/shared/breadcrumb/BreadcrumbComp";

type Question = {
  _id: string;
  leftOption: string;
  rightOption: string;
  leftImageUrl: string;
  rightImageUrl: string;
  submittedBy?: {
    username?: string;
  };
};

const BCrumb = [{ to: "/", title: "home" }, { title: "this-or-that" }];

export default function ThisOrThatGameSubmissionsPage() {
  const [rows, setRows] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPendingQuestions({ page: 1, limit: 50 });
      setRows(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await setQuestionStatus(id, status);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="Game Submissions" items={BCrumb} />
      <h1 className="text-2xl font-bold">This-or-That Game Submissions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          {loading ? <p>Loading...</p> : null}
          {!loading && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending submissions.
            </p>
          ) : null}
          <div className="grid gap-3">
            {rows.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <p className="font-medium">
                  {item.leftOption} vs {item.rightOption}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted by: {item.submittedBy?.username || "unknown"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <img
                    src={item.leftImageUrl}
                    alt={item.leftOption}
                    className="h-20 w-28 rounded-md object-cover border border-border"
                  />
                  <img
                    src={item.rightImageUrl}
                    alt={item.rightOption}
                    className="h-20 w-28 rounded-md object-cover border border-border"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => updateStatus(item._id, "approved")}>
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(item._id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
