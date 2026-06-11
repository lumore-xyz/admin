"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminStats,
  getCreditLedgerAnalytics,
  type CreditLedgerAnalytics,
  type LedgerAnalyticsPeriod,
} from "@/lib/admin-api";
import { useEffect, useState } from "react";
import BreadcrumbComp from "../layout/shared/breadcrumb/BreadcrumbComp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type DashboardStats = {
  totalUsers?: number;
  activeUsers?: number;
  matchingUsers?: number;
  archivedUsers?: number;
  pendingQuestions?: number;
  onlineNow?: number;
  verifiedUsers?: number;
  inactiveUsers?: number;
  genderDistribution?: {
    male?: number;
    female?: number;
    other?: number;
    unknown?: number;
  };
  verificationBreakdown?: {
    not_started?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
    failed?: number;
  };
  ageDistribution?: {
    "<18"?: number;
    "18-24"?: number;
    "25-34"?: number;
    "35-44"?: number;
    "45-54"?: number;
    "55+"?: number;
  };
  locationAnalytics?: {
    mode?: "global" | "country";
    selectedCountry?: string | null;
    level?: "country" | "state";
    distribution?: Array<{
      key: string;
      label: string;
      count: number;
    }>;
    availableCountries?: Array<{
      key: string;
      label: string;
      count: number;
    }>;
  };
  credit?: {
    transactions?: number;
    totalAwarded?: number;
    totalSpent?: number;
  };
};

const BCrumb = [
  {
    to: "/",
    title: "Dashboard",
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationMode, setLocationMode] = useState<"global" | "country">("global");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [analyticsPeriod, setAnalyticsPeriod] =
    useState<LedgerAnalyticsPeriod>("daily");
  const [ledgerAnalytics, setLedgerAnalytics] =
    useState<CreditLedgerAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAdminStats({
          locationMode,
          country: locationMode === "country" ? selectedCountry : undefined,
          locationLimit: 10,
        });
        setData(res.data);
        if (locationMode === "country" && !selectedCountry) {
          const firstCountry = res.data?.locationAnalytics?.availableCountries?.[0]?.key;
          if (firstCountry) {
            setSelectedCountry(firstCountry);
          }
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locationMode, selectedCountry]);

  useEffect(() => {
    let isCurrent = true;
    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError("");
        const limit =
          analyticsPeriod === "daily"
            ? 30
            : analyticsPeriod === "monthly"
              ? 12
              : 5;
        const res = await getCreditLedgerAnalytics({
          period: analyticsPeriod,
          limit,
        });
        if (isCurrent) {
          setLedgerAnalytics(res.data);
        }
      } catch (err: unknown) {
        if (isCurrent) {
          setAnalyticsError(
            err instanceof Error
              ? err.message
              : "Failed to load credit activity",
          );
        }
      } finally {
        if (isCurrent) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      isCurrent = false;
    };
  }, [analyticsPeriod]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-error">{error}</p>;

  const gender = data?.genderDistribution || {};
  const verification = data?.verificationBreakdown || {};
  const age = data?.ageDistribution || {};
  const location = data?.locationAnalytics || {};
  const locationSeries = (location.distribution || []).map((x) => x.count);
  const locationLabels = (location.distribution || []).map((x) => x.label);
  const ledgerSeries = ledgerAnalytics?.series;
  const ledgerLabels = (ledgerSeries?.dailyActive || []).map((x) => x.label);
  const activeUserTitle =
    analyticsPeriod === "daily"
      ? "Daily Active Users"
      : analyticsPeriod === "monthly"
        ? "Monthly Active Users"
        : "Yearly Active Users";

  const cards = [
    { title: "Total Users", value: data?.totalUsers ?? 0 },
    { title: "Online Right Now", value: data?.onlineNow ?? 0 },
    { title: "Active Users", value: data?.activeUsers ?? 0 },
    { title: "Inactive Users", value: data?.inactiveUsers ?? 0 },
    { title: "Matching Users", value: data?.matchingUsers ?? 0 },
    { title: "Archived Users", value: data?.archivedUsers ?? 0 },
    { title: "Male Users", value: gender.male ?? 0 },
    { title: "Female Users", value: gender.female ?? 0 },
    { title: "Verified Users", value: data?.verifiedUsers ?? 0 },
    { title: "Pending Questions", value: data?.pendingQuestions ?? 0 },
    { title: "Credit Transactions", value: data?.credit?.transactions ?? 0 },
  ];

  const genderChart: ApexOptions = {
    chart: { type: "donut", toolbar: { show: false }, height: 280 },
    labels: ["Male", "Female", "Other", "Unknown"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    colors: ["#3b82f6", "#ec4899", "#a855f7", "#94a3b8"],
    stroke: { show: false },
  };

  const verificationChart: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, height: 280 },
    xaxis: {
      categories: ["Not Started", "Pending", "Approved", "Rejected", "Failed"],
    },
    dataLabels: { enabled: false },
    colors: ["#64748b"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
  };

  const ageChart: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, height: 280 },
    xaxis: { categories: ["<18", "18-24", "25-34", "35-44", "45-54", "55+"] },
    dataLabels: { enabled: false },
    colors: ["#10b981"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
  };

  const locationChart: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, height: 320 },
    xaxis: {
      categories: locationLabels,
      labels: {
        rotate: -35,
        trim: true,
      },
    },
    dataLabels: { enabled: false },
    colors: ["#2563eb"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "50%" } },
  };

  const getLedgerChart = (color: string): ApexOptions => ({
    chart: { type: "bar", toolbar: { show: false }, height: 300 },
    xaxis: {
      categories: ledgerLabels,
      labels: {
        rotate: analyticsPeriod === "daily" ? -45 : -35,
        trim: true,
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      min: 0,
      decimalsInFloat: 0,
      labels: {
        formatter: (value) => `${Math.round(Number(value) || 0)}`,
      },
    },
    dataLabels: { enabled: false },
    colors: [color],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "55%" } },
    tooltip: {
      y: {
        formatter: (value) => `${Math.round(Number(value) || 0)}`,
      },
    },
  });

  return (
    <div className="space-y-4">
      <BreadcrumbComp title="Lumore Dashboard" items={BCrumb} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Credit Ledger Activity</CardTitle>
          <Select
            value={analyticsPeriod}
            onValueChange={(value) =>
              setAnalyticsPeriod(value as LedgerAnalyticsPeriod)
            }
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          ) : analyticsError ? (
            <p className="text-sm text-error">{analyticsError}</p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="min-w-0 rounded-md border border-border p-3">
                <p className="text-sm font-medium">{activeUserTitle}</p>
                <Chart
                  type="bar"
                  options={getLedgerChart("#0ea5e9")}
                  series={[
                    {
                      name: "Users",
                      data: (ledgerSeries?.dailyActive || []).map(
                        (x) => x.count,
                      ),
                    },
                  ]}
                  height={300}
                />
              </div>
              <div className="min-w-0 rounded-md border border-border p-3">
                <p className="text-sm font-medium">Signups</p>
                <Chart
                  type="bar"
                  options={getLedgerChart("#f97316")}
                  series={[
                    {
                      name: "Users",
                      data: (ledgerSeries?.signups || []).map((x) => x.count),
                    },
                  ]}
                  height={300}
                />
              </div>
              <div className="min-w-0 rounded-md border border-border p-3">
                <p className="text-sm font-medium">Matches Created</p>
                <Chart
                  type="bar"
                  options={getLedgerChart("#22c55e")}
                  series={[
                    {
                      name: "Matches",
                      data: (ledgerSeries?.conversations || []).map(
                        (x) => x.count,
                      ),
                    },
                  ]}
                  height={300}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gender Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="donut"
              options={genderChart}
              series={[
                gender.male ?? 0,
                gender.female ?? 0,
                gender.other ?? 0,
                gender.unknown ?? 0,
              ]}
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="bar"
              options={verificationChart}
              series={[
                {
                  name: "Users",
                  data: [
                    verification.not_started ?? 0,
                    verification.pending ?? 0,
                    verification.approved ?? 0,
                    verification.rejected ?? 0,
                    verification.failed ?? 0,
                  ],
                },
              ]}
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="bar"
              options={ageChart}
              series={[
                {
                  name: "Users",
                  data: [
                    age["<18"] ?? 0,
                    age["18-24"] ?? 0,
                    age["25-34"] ?? 0,
                    age["35-44"] ?? 0,
                    age["45-54"] ?? 0,
                    age["55+"] ?? 0,
                  ],
                },
              ]}
              height={280}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Location Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <Select
              value={locationMode}
              onValueChange={(value) =>
                setLocationMode(value as "global" | "country")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (country-wise)</SelectItem>
                <SelectItem value="country">Country (state-wise)</SelectItem>
              </SelectContent>
            </Select>

            <Select
              disabled={locationMode !== "country"}
              value={selectedCountry || undefined}
              onValueChange={(value) => setSelectedCountry(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {(location.availableCountries || []).map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label} ({item.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {locationSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No location data available for current filter.
            </p>
          ) : (
            <Chart
              type="bar"
              options={locationChart}
              series={[{ name: "Users", data: locationSeries }]}
              height={320}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Economy Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <p className="text-sm text-muted-foreground">Total Awarded</p>
              <p className="text-xl font-semibold">
                {data?.credit?.totalAwarded ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-xl font-semibold">
                {Math.abs(data?.credit?.totalSpent ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
