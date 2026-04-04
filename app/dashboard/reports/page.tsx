"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/services/api";
import type { ReportPeriodResult, ContactMethodBreakdown } from "@/utils/types";
import { format, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { BarChart2, Download, Calendar, RefreshCw, TrendingUp, Home, Building2, Moon } from "lucide-react";
import clsx from "clsx";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Period = "daily" | "weekly" | "monthly" | "custom";

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function MetricBox({ label, value, sub, color = "blue" }: {
  label: string; value: string | number; sub?: string; color?: "blue" | "green" | "purple";
}) {
  const colors = {
    blue:   "bg-blue-50   border-blue-200   text-blue-700",
    green:  "bg-green-50  border-green-200  text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={clsx("rounded-xl border p-4", colors[color])}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

function BreakdownTable({ rows }: { rows: ContactMethodBreakdown[] }) {
  if (!rows || rows.length === 0) {
    return <p className="text-xs text-gray-400 italic">No data for this period.</p>;
  }
  return (
    <table className="data-table w-full text-xs">
      <thead>
        <tr>
          <th>Contact Method</th>
          <th className="text-right">Received</th>
          <th className="text-right">Sold</th>
          <th className="text-right">Conversion</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.contact_method_id}>
            <td className="capitalize font-medium">{row.contact_method_name}</td>
            <td className="text-right">{row.received}</td>
            <td className="text-right text-green-700 font-medium">{row.sold}</td>
            <td className="text-right">
              <span className={clsx(
                "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                row.conversion_rate >= 50 ? "bg-green-100 text-green-700" :
                row.conversion_rate >= 25 ? "bg-amber-100 text-amber-700" :
                "bg-gray-100 text-gray-600"
              )}>
                {pct(row.conversion_rate)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [anchorDate, setAnchorDate] = useState(new Date().toISOString().split("T")[0]);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const queryParams =
    period === "custom"
      ? { period, date_from: customFrom, date_to: customTo }
      : { period, anchor_date: anchorDate };

  const { data, isLoading, refetch, isFetching } = useQuery<ReportPeriodResult>({
    queryKey: ["report", queryParams],
    queryFn: () => reportsApi.get(queryParams),
    enabled: period !== "custom" || (!!customFrom && !!customTo),
  });

  // Navigate periods
  const navigatePeriod = (dir: -1 | 1) => {
    const d = new Date(anchorDate);
    if (period === "daily") d.setDate(d.getDate() + dir);
    if (period === "weekly") d.setDate(d.getDate() + 7 * dir);
    if (period === "monthly") d.setMonth(d.getMonth() + dir);
    setAnchorDate(d.toISOString().split("T")[0]);
  };

  // Export to Excel
  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    // Residential sheet
    const resRows = [
      ["Contact Method", "Received", "Sold", "Conversion %"],
      ...(data.residential.by_contact_method || []).map((r) => [
        r.contact_method_name, r.received, r.sold, r.conversion_rate.toFixed(1),
      ]),
      ["TOTAL", data.residential.total_received, data.residential.total_sold,
       data.residential.conversion_rate.toFixed(1)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resRows), "Residential");

    // Commercial sheet
    const comRows = [
      ["Metric", "Value"],
      ["Received", data.commercial.total_received],
      ["Sold", data.commercial.total_sold],
      ["Conversion %", data.commercial.conversion_rate.toFixed(1)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(comRows), "Commercial");

    XLSX.writeFile(wb, `phantom-report-${data.period_label.replace(/\s/g, "-")}.xlsx`);
  };

  // Export to PDF
  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Phantom Pest Control — CRM Report", 14, 15);
    doc.setFontSize(11);
    doc.text(data.period_label, 14, 23);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated: ${format(new Date(), "PPP")}`, 14, 29);
    doc.setTextColor(0);

    // Totals
    doc.setFontSize(11);
    doc.text("Summary", 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [["Total Received", "Total Sold", "Conversion Rate"]],
      body: [[
        data.totals.total_received,
        data.totals.total_sold,
        pct(data.totals.conversion_rate),
      ]],
      headStyles: { fillColor: [79, 98, 245] },
    });

    // Residential
    const afterSummary = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.text("Residential — By Contact Method", 14, afterSummary);
    autoTable(doc, {
      startY: afterSummary + 4,
      head: [["Contact Method", "Received", "Sold", "Conv%"]],
      body: (data.residential.by_contact_method || []).map((r) => [
        r.contact_method_name, r.received, r.sold, pct(r.conversion_rate),
      ]),
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Commercial
    const afterRes = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.text("Commercial", 14, afterRes);
    autoTable(doc, {
      startY: afterRes + 4,
      head: [["Received", "Sold", "Conv%"]],
      body: [[
        data.commercial.total_received,
        data.commercial.total_sold,
        pct(data.commercial.conversion_rate),
      ]],
      headStyles: { fillColor: [245, 158, 11] },
    });

    doc.save(`phantom-report-${data.period_label.replace(/\s/g, "-")}.pdf`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-fade-in" ref={printRef}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-phantom-600" />
            Reports
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            All sales counted by <strong>first_contact_date</strong> — retroactive accuracy guaranteed.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary py-1.5 text-xs"
          >
            <RefreshCw className={clsx("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
          <button onClick={exportExcel} disabled={!data} className="btn-secondary py-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Excel
          </button>
          <button onClick={exportPDF} disabled={!data} className="btn-secondary py-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Period controls */}
      <div className="card p-4 no-print">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period type tabs */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["daily", "weekly", "monthly", "custom"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  period === p
                    ? "bg-phantom-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {period !== "custom" ? (
            <>
              {/* Navigation arrows */}
              <button onClick={() => navigatePeriod(-1)} className="btn-secondary py-1 px-2 text-xs">←</button>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <input
                  type="date"
                  value={anchorDate}
                  onChange={(e) => setAnchorDate(e.target.value)}
                  className="input-base py-1.5 text-xs w-36"
                />
              </div>
              <button onClick={() => navigatePeriod(1)} className="btn-secondary py-1 px-2 text-xs">→</button>
              <button
                onClick={() => setAnchorDate(new Date().toISOString().split("T")[0])}
                className="text-xs text-phantom-600 hover:text-phantom-700"
              >
                Today
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input-base py-1.5 text-xs w-36"
              />
              <label className="text-xs text-gray-600">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input-base py-1.5 text-xs w-36"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-phantom-600 border-t-transparent rounded-full" />
        </div>
      )}

      {data && (
        <>
          {/* Period label */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">{data.period_label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(data.date_from), "MMM d, yyyy")} — {format(new Date(data.date_to), "MMM d, yyyy")}
            </p>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricBox
              label="Total Received"
              value={data.totals.total_received}
              sub="All property types"
              color="blue"
            />
            <MetricBox
              label="Total Sold"
              value={data.totals.total_sold}
              sub={`${pct(data.totals.conversion_rate)} conversion`}
              color="green"
            />
            <MetricBox
              label="After Hours"
              value={data.after_hours.total_received}
              sub={`${data.after_hours.total_sold} sold · ${pct(data.after_hours.conversion_rate)}`}
              color="purple"
            />
          </div>

          {/* Residential */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">Residential</h3>
              <span className="ml-auto text-xs text-gray-500">
                {data.residential.total_sold}/{data.residential.total_received} sold
                <span className="ml-2 font-medium text-green-700">({pct(data.residential.conversion_rate)})</span>
              </span>
            </div>
            <BreakdownTable rows={data.residential.by_contact_method} />
          </div>

          {/* Commercial */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-800">Commercial</h3>
              <span className="ml-auto text-xs text-gray-500">
                {data.commercial.total_sold}/{data.commercial.total_received} sold
                <span className="ml-2 font-medium text-green-700">({pct(data.commercial.conversion_rate)})</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500">Received</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{data.commercial.total_received}</p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-xs text-green-600">Sold</p>
                <p className="text-xl font-bold text-green-700 mt-1">{data.commercial.total_sold}</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                <p className="text-xs text-blue-600">Conversion</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{pct(data.commercial.conversion_rate)}</p>
              </div>
            </div>
          </div>

          {/* After Hours */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-800">After Hours Performance</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500">Received</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{data.after_hours.total_received}</p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-xs text-green-600">Sold</p>
                <p className="text-xl font-bold text-green-700 mt-1">{data.after_hours.total_sold}</p>
              </div>
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center">
                <p className="text-xs text-purple-600">Conversion</p>
                <p className="text-xl font-bold text-purple-700 mt-1">{pct(data.after_hours.conversion_rate)}</p>
              </div>
            </div>
          </div>

          {/* Data note */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
            <strong>Reporting rule:</strong> All sales are attributed to the week/period when the client was
            first contacted (<code className="bg-blue-100 px-1 rounded">first_contact_date</code>), not when the
            sale was made. If a client was first contacted last week and sold today, that sale appears in
            last week's report. Reports always recalculate live — no snapshots.
          </div>
        </>
      )}
    </div>
  );
}
