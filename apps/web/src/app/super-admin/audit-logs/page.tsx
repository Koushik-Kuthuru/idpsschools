"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
const SafeLink = Link as any;
;
import {
  Home,
  ChevronRight,
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildPath, fetchMany, buildQuery, sortBy, limitTo, filterBy, db, auth } from "@/lib/db-client";




function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("All");

  useEffect(() => {
    async function fetchLogs() {
      try {
        const logsSnapshot = await fetchMany(
          buildQuery(buildPath(db, "audit_logs"), sortBy("createdAt", "desc"), limitTo(100))
        );
        const logsData = logsSnapshot.docs.map((buildPath) => {
          const data = buildPath.data();
          const timestamp = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          return {
            id: buildPath.id,
            action: data.action || "Unknown Action",
            entity: data.entity || "N/A",
            user: data.userName || "System",
            status: data.status || "Completed",
            timestamp,
            description: data.description || "",
          };
        });
        setLogs(logsData);
        setFilteredLogs(logsData);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entity.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== "All") {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === "Today") {
        filterDate.setDate(filterDate.getDate() - 1);
      } else if (dateFilter === "This Week") {
        filterDate.setDate(filterDate.getDate() - 7);
      } else if (dateFilter === "This Month") {
        filterDate.setDate(filterDate.getDate() - 30);
      }

      filtered = filtered.filter((log) => log.timestamp >= filterDate);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, dateFilter, logs]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-100";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "failed":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs font-medium text-gray-500 mb-4">
        <SafeLink href="/super-admin" className="hover:text-[#144835] transition-colors flex items-center gap-1">
          <Home size={14} /> Dashboard
        </SafeLink>
        <ChevronRight size={14} className="mx-2" />
        <span className="text-[#144835] font-semibold">Audit Logs</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Audit Logs</h1>
          <p className="text-gray-500 text-xs mt-1">Track all system activities and user actions.</p>
        </div>
        <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
          <Download size={14} />
          Export Logs
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50/30">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by action, user, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative min-w-[140px]">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer font-medium hover:border-gray-300 transition-colors shadow-sm"
              >
                <option>All</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
            </div>

            <button className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#144835] transition-colors shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Entity</th>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Time Ago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1A1A1A]">{log.action}</p>
                          {log.description && (
                            <p className="text-xs text-gray-500">{log.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-gray-700">{log.entity}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-gray-700">{log.user}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", getStatusColor(log.status))}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        {log.timestamp.toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        {formatTime(log.timestamp)}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <FileText size={32} className="text-gray-300" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">No audit logs found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing <span className="font-bold text-gray-900">{filteredLogs.length}</span> of{" "}
            <span className="font-bold text-gray-900">{logs.length}</span> audit logs
          </p>
        </div>
      </div>
    </div>
  );
}
