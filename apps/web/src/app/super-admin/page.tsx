"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
const SafeLink = Link as any;
;
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  IndianRupee,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import FranchiseGrowthChart from "@/components/super-admin/FranchiseGrowthChart";
import { collection, getDocs, query, limit, orderBy, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function relTime(val: any): string {
  if (!val) return "Recently";
  const date = val?.toDate ? val.toDate() : new Date(val);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-IN");
}

export default function SuperAdminDashboard() {
  const [schools, setSchools] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  // activities: aggregated from all schools' /activity subcollections
  const [activities, setActivities] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    // ── 1. Fetch schools list once (for stats, table, pending actions) ──────
    async function fetchStatsAndPending() {
      try {
        const schoolsSnapshot = await getDocs(query(collection(db, "schools"), limit(10)));
        const schoolsData = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setSchools(schoolsData);

        // Stats
        const totalBranches = schoolsData.length;
        const totalStudents = schoolsData.reduce((acc, s) => acc + (s.students || 0), 0);
        const totalTeachers = schoolsData.reduce((acc, s) => acc + (s.teachers || 0), 0);

        let totalRevenue = 0;
        for (const school of schoolsData) {
          try {
            const txSnap = await getDocs(collection(db, "schools", school.id, "transactions"));
            txSnap.docs.forEach(d => {
              const raw = d.data().amount;
              // amount may be a number or a string like "₹45,000"
              const num = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, ""));
              if (!isNaN(num)) totalRevenue += num;
            });
          } catch {}
        }

        setStats([
          { title: "Total Revenue",   value: formatCurrency(totalRevenue),          change: "+12.5%", trend: "up",   icon: IndianRupee },
          { title: "Total Branches",  value: totalBranches.toString(),               change: "+1 new", trend: "up",   icon: Building2 },
          { title: "Active Students", value: totalStudents.toLocaleString("en-IN"),  change: "+5.2%",  trend: "up",   icon: GraduationCap },
          { title: "Total Staff",     value: totalTeachers.toLocaleString("en-IN"),  change: "+4.2%",  trend: "up",   icon: Users },
        ]);

        // Pending actions — from each school's subcollections
        const pending: any[] = [];
        for (const school of schoolsData) {
          try {
            const leavesSnap = await getDocs(
              query(collection(db, "schools", school.id, "leaves"), where("status", "==", "Pending"), limit(2))
            );
            leavesSnap.docs.forEach(d => {
              const data = d.data();
              pending.push({
                type: "leave",
                label: `${data.employeeName || data.staffName || "Staff"} — Leave Request`,
                branch: school.name || school.id,
                time: relTime(data.createdAt || data.startDate),
                icon: Users,
                id: d.id,
              });
            });

            const expSnap = await getDocs(
              query(collection(db, "schools", school.id, "expenses"), where("status", "==", "Pending"), limit(2))
            );
            expSnap.docs.forEach(d => {
              const data = d.data();
              pending.push({
                type: "expense",
                label: `Expense: ${data.description || data.category || "Pending Review"}`,
                branch: school.name || school.id,
                time: relTime(data.createdAt),
                icon: Briefcase,
                id: d.id,
              });
            });

            const appSnap = await getDocs(
              query(collection(db, "schools", school.id, "applications"), where("status", "==", "Pending"), limit(1))
            );
            appSnap.docs.forEach(d => {
              const data = d.data();
              pending.push({
                type: "application",
                label: `Admission — ${data.studentName || data.name || "New Applicant"}`,
                branch: school.name || school.id,
                time: relTime(data.createdAt),
                icon: GraduationCap,
                id: d.id,
              });
            });
          } catch {}
        }
        setPendingActions(pending.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatsAndPending();
  }, []);

  // ── 2. Live activity listeners for every school — same pattern as branch admin ──
  useEffect(() => {
    if (schools.length === 0) return;

    // Map of schoolId → its latest activity docs
    const schoolActivities: Record<string, any[]> = {};
    const unsubs: (() => void)[] = [];

    function rebuild() {
      // Merge all schools' activities, sort newest-first, keep top 8
      const merged = Object.entries(schoolActivities)
        .flatMap(([schoolId, docs]) => docs.map(a => ({ ...a, schoolId })))
        .sort((a, b) => {
          const ta = a._ts ?? 0;
          const tb = b._ts ?? 0;
          return tb - ta;
        })
        .slice(0, 8);
      setActivities(merged);
    }

    for (const school of schools) {
      schoolActivities[school.id] = [];
      const unsub = onSnapshot(
        query(
          collection(db, "schools", school.id, "activity"),
          orderBy("createdAt", "desc"),
          limit(5),
        ),
        (snap) => {
          schoolActivities[school.id] = snap.docs.map(d => {
            const data = d.data();
            const ts = data.createdAt?.toDate
              ? data.createdAt.toDate().getTime()
              : data.createdAt
              ? new Date(data.createdAt).getTime()
              : 0;
            return {
              id: d.id,
              text: data.text ?? data.title ?? "Activity",
              time: relTime(data.createdAt),
              branch: school.name ?? school.id,
              href: data.href ?? `/super-admin/branches/${school.id}`,
              _ts: ts,
            };
          });
          rebuild();
        },
        (err) => console.warn(`activity listener error for ${school.id}:`, err),
      );
      unsubs.push(unsub);
    }

    return () => unsubs.forEach(u => u());
  }, [schools]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
      </div>
    );
  }

  const statStyles = [
    { bg: "bg-emerald-50", color: "text-emerald-600" },
    { bg: "bg-blue-50",    color: "text-blue-600"    },
    { bg: "bg-orange-50",  color: "text-orange-600"  },
    { bg: "bg-purple-50",  color: "text-purple-600"  },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-jost">
      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-r from-[#144835] to-[#0f3628] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-full w-2/3 bg-white/5 skew-x-12 transform translate-x-20 transition-transform duration-700 group-hover:translate-x-10"></div>
        <div className="absolute right-[-5%] bottom-[-50%] w-64 h-64 bg-[#a2c144]/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-[#a2c144] mb-3 border border-white/10">Dashboard Overview</div>
          <h1 className="text-xl font-bold mb-3">Welcome back, Super Admin!</h1>
          <p className="text-[#faf1e2]/80 text-lg leading-relaxed">
            {pendingActions.length > 0
              ? <>Here&apos;s what&apos;s happening across your network. You have <span className="font-bold text-white">{pendingActions.length} pending actions</span> requiring attention.</>
              : <>Here&apos;s what&apos;s happening with your franchise network today.</>}
          </p>
          <div className="mt-6 flex gap-3">
            <SafeLink href="/super-admin/branches" className="px-5 py-2.5 bg-[#a2c144] text-[#144835] font-bold rounded-lg shadow-lg shadow-[#a2c144]/20 hover:bg-white hover:text-[#144835] transition-all transform hover:-translate-y-0.5 text-xs inline-flex items-center gap-2">
              View Branches <ArrowUpRight size={14} />
            </SafeLink>
            <SafeLink href="/super-admin/users" className="px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all text-xs backdrop-blur-sm inline-flex items-center gap-2">
              Manage Users
            </SafeLink>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const s = statStyles[idx % statStyles.length];
          return (
            <div key={idx} className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer">
              <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500", s.color)}>
                <stat.icon size={64} />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={cn("p-3 rounded-lg", s.bg, s.color)}><stat.icon size={20} /></div>
                <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-lg", stat.trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                  {stat.trend === "up" ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                  {stat.change}
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                <p className="text-gray-500 font-medium text-xs">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left: chart + branch table */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          <FranchiseGrowthChart />

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Branch Performance</h2>
                <p className="text-xs text-gray-500 mt-1">Key metrics across top performing campuses</p>
              </div>
              <SafeLink href="/super-admin/branches" className="text-xs font-medium text-[#004D40] hover:bg-[#004D40]/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                View All <ChevronRight size={14} />
              </SafeLink>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Campus</th>
                    <th className="px-4 py-2.5">Capacity</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schools.slice(0, 4).map((branch, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <SafeLink href={`/super-admin/branches/${encodeURIComponent(branch.id)}`} className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#144835]/10 group-hover:text-[#144835] transition-colors">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#144835] transition-colors">{branch.name}</p>
                            <p className="text-xs text-gray-500">{branch.city}, {branch.state}</p>
                          </div>
                        </SafeLink>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-[#004D40] rounded-full" style={{ width: `${branch.progress ?? 0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{branch.progress ?? 0}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{branch.students ?? 0} Students</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                          branch.status === "Active" ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", branch.status === "Active" ? "bg-green-600" : "bg-amber-600")} />
                          {branch.status ?? "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <SafeLink href={`/super-admin/branches/${encodeURIComponent(branch.id)}`} className="p-2 text-gray-400 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-colors inline-block" title="View Details">
                          <ExternalLink size={18} />
                        </SafeLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Pending Actions + Recent Activity */}
        <div className="space-y-8">

          {/* Pending Actions */}
          <div className="bg-[#144835] rounded-[16px] p-4 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 size={100} /></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-xl font-bold">Pending Actions</h3>
                  <p className="text-[#a2c144] text-xs font-bold uppercase tracking-wider mt-1">
                    {pendingActions.length > 0 ? `${pendingActions.length} Require Attention` : "All clear"}
                  </p>
                </div>
                <div className="p-2 bg-white/10 rounded-lg">
                  <AlertCircle size={20} className="text-[#a2c144]" />
                </div>
              </div>
              <div className="space-y-3">
                {pendingActions.length > 0 ? (
                  pendingActions.map((action, i) => (
                    <div key={`${action.id}-${i}`} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="p-2 bg-white/10 rounded-lg shrink-0">
                        <action.icon size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{action.label}</p>
                        <p className="text-xs text-white/50 mt-0.5">{action.branch} · {action.time}</p>
                      </div>
                      <ChevronRight size={14} className="text-white/30 shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-white/50 text-center py-5 flex flex-col items-center gap-2">
                    <CheckCircle2 size={22} className="text-[#a2c144]/60" />
                    No pending actions across all branches
                  </div>
                )}
              </div>
              <SafeLink href="/super-admin/audit-logs" className="w-full mt-6 py-3 bg-[#a2c144] text-[#144835] font-bold rounded-lg text-xs hover:bg-white transition-colors shadow-lg shadow-black/10 block text-center">
                View All Notifications
              </SafeLink>
            </div>
          </div>

          {/* Recent Activity — live from all schools' /activity subcollection */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#144835]/5 text-[#144835] flex items-center justify-center border border-[#144835]/10">
                  <Activity size={16} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Across all branches · Live</p>
                </div>
              </div>
              <button onClick={() => setLogOpen(true)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all hover:border-gray-300 group">
                View Log <ChevronRight size={12} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="p-4 bg-gray-50/30">
              {activities.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-8">No recent activity recorded yet.</p>
              ) : (
                <div className="relative border-l border-gray-200 ml-3 space-y-5 py-1">
                  {activities.slice(0, 5).map((activity, idx) => (
                    <div key={`${activity.id}-${activity.schoolId}-${idx}`} className="relative pl-6 group">
                      <div className={cn(
                        "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-[2px] border-white ring-2 ring-gray-50 transition-all duration-300",
                        idx === 0
                          ? "bg-[#144835] ring-[#144835]/10 scale-125 shadow-[0_0_10px_rgba(20,72,53,0.3)]"
                          : "bg-gray-300 group-hover:bg-[#a2c144] group-hover:scale-110"
                      )} />
                      <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] group-hover:border-[#144835]/30 group-hover:shadow-[0_8px_20px_rgba(20,72,53,0.08)] transition-all duration-300 transform group-hover:-translate-y-0.5">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-[#144835] transition-colors leading-snug">{activity.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              <Clock size={9} /> {activity.time}
                            </span>
                            <span className="text-xs font-bold text-[#144835]/60 bg-[#144835]/5 px-1.5 py-0.5 rounded uppercase tracking-wider max-w-[90px] truncate">
                              {activity.branch}
                            </span>
                          </div>
                          <SafeLink href={activity.href} className="text-xs font-bold text-[#144835] uppercase tracking-wider hover:underline flex items-center gap-0.5 shrink-0">
                            View <ArrowUpRight size={9} />
                          </SafeLink>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 pb-4">
              <SafeLink href="/super-admin/audit-logs" className="w-full py-2.5 text-xs font-medium text-gray-600 hover:text-[#004D40] hover:bg-gray-50 rounded-lg transition-all border border-gray-200 border-dashed block text-center">
                View Full Activity Log
              </SafeLink>
            </div>
          </div>

        </div>
      </div>

      {/* Activity Log Drawer */}
      {logOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLogOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">All Branches · Live</p>
                <h3 className="text-lg font-bold text-gray-900">Activity Log</h3>
              </div>
              <button onClick={() => setLogOpen(false)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                <X size={14} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 space-y-3">
              {activities.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-8">No activity recorded yet.</p>
              ) : (
                activities.map((item, i) => (
                  <div key={`${item.id}-${item.schoolId}-${i}`} className="rounded-lg border border-gray-100 bg-gray-50/60 p-4 hover:bg-white hover:shadow-sm hover:border-[#144835]/20 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">{item.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock size={9} /> {item.time}
                          </span>
                          <span className="text-xs font-bold text-[#144835]/70 bg-[#144835]/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {item.branch}
                          </span>
                        </div>
                      </div>
                      <SafeLink href={item.href} className="text-xs font-bold text-[#144835] hover:text-[#144835]/80 inline-flex items-center gap-1 shrink-0 mt-0.5">
                        View <ChevronRight size={13} />
                      </SafeLink>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
