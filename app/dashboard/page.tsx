"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/services/api";
import type { DashboardResponse, ClientStatus } from "@/utils/types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT } from "@/utils/types";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { TrendingUp, Users, Target, Clock } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

function StatCard({
  label, value, sub, icon: Icon, trend
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: number;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className="rounded-xl bg-phantom-50 p-2.5">
          <Icon className="h-5 w-5 text-phantom-600" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={clsx(
          "mt-3 text-xs font-medium",
          trend >= 0 ? "text-green-600" : "text-red-600"
        )}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  );
}

const STATUS_CHART_COLORS: Record<string, string> = {
  blue: "#3b82f6", white: "#94a3b8", yellow: "#eab308",
  purple: "#a855f7", green: "#22c55e", red: "#ef4444",
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: reportsApi.getDashboard,
    refetchInterval: 60_000, // auto-refresh every 60s
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-phantom-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  const { today_stats, this_week_stats, this_month_stats, weekly_trend, top_performers, status_distribution } = data;

  const statusChartData = Object.entries(status_distribution || {}).map(([status, count]) => ({
    status: STATUS_LABELS[status as ClientStatus] || status,
    count,
    color: STATUS_CHART_COLORS[status] || "#94a3b8",
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live overview — updates every minute</p>
        </div>
        <Link href="/dashboard/clients/new" className="btn-primary">
          + New Client
        </Link>
      </div>

      {/* Period stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today — Received"
          value={today_stats?.totals?.total_received ?? 0}
          sub="Total leads today"
          icon={Users}
        />
        <StatCard
          label="Today — Sold"
          value={today_stats?.totals?.total_sold ?? 0}
          sub={`${(today_stats?.totals?.conversion_rate ?? 0).toFixed(1)}% conversion`}
          icon={Target}
        />
        <StatCard
          label="This Week — Sold"
          value={this_week_stats?.totals?.total_sold ?? 0}
          sub={`of ${this_week_stats?.totals?.total_received ?? 0} received`}
          icon={TrendingUp}
        />
        <StatCard
          label="This Month — Sold"
          value={this_month_stats?.totals?.total_sold ?? 0}
          sub={`${(this_month_stats?.totals?.conversion_rate ?? 0).toFixed(1)}% conversion`}
          icon={Clock}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly trend */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Weekly Trend — Last 12 Weeks</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekly_trend || []}>
              <defs>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f62f5" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4f62f5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="total_received" name="Received" stroke="#4f62f5" strokeWidth={2} fill="url(#colorReceived)" />
              <Area type="monotone" dataKey="total_sold" name="Sold" stroke="#22c55e" strokeWidth={2} fill="url(#colorSold)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Client Status Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChartData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {statusChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* This week breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">This Week — By Contact Method (Residential)</h2>
          <div className="space-y-2">
            {(this_week_stats?.residential?.by_contact_method || []).map((row) => (
              <div key={row.contact_method_id} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-600 capitalize truncate">{row.contact_method_name}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-phantom-500 rounded-full"
                    style={{ width: `${Math.min(100, (row.received / Math.max(1, this_week_stats.residential.total_received)) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 w-16 text-right">
                  {row.sold}/{row.received} ({row.conversion_rate.toFixed(0)}%)
                </div>
              </div>
            ))}
            {(this_week_stats?.residential?.by_contact_method?.length ?? 0) === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No residential data this week</p>
            )}
          </div>
        </div>

        {/* Top performers */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Performers — This Month</h2>
          <div className="space-y-3">
            {(top_performers || []).map((p, i) => (
              <div key={p.user_id} className="flex items-center gap-3">
                <div className={clsx(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                  i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : "bg-amber-700"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {p.full_name || p.email.split("@")[0]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.residential_sales} residential · {p.commercial_sales} commercial
                  </p>
                </div>
                <div className="text-sm font-bold text-green-600">{p.total_sales}</div>
              </div>
            ))}
            {(top_performers?.length ?? 0) === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No sales data this month</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
