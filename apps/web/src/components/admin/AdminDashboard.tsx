"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
const SafeLink = Link as any;
;
import {
  Users,
  GraduationCap,
  Wallet,
  BookOpen,
  CalendarCheck,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Activity,
  ChevronRight,
  Plus,
  X,
  MapPin,
  Check,
  Bus,
  Building2,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


import {
  computeStudentAttendancePercent,
  computeTodayStudentAttendancePercent,
  isInCurrentMonth,
  isUpcomingEvent,
  mapApplicationDoc,
  mapEventCreatedDoc,
  mapExpenseDoc,
  mapLeaveDoc,
  mapMessageDoc,
  mapPaymentDoc,
  mapStudentDoc,
  mergeLiveActivities,
  relTime,
  toMillis,
  computeTransportHostelMetrics,
  parseDateKey,
  type LiveActivity,
} from "@/lib/adminDashboardLive";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchTransportBuses } from "@/hooks/useBranchTransportBuses";
import { useBranchTransportStudents } from "@/hooks/useBranchTransportStudents";
import { buildPath, limitTo, subscribeData, sortBy, buildQuery, patchData, filterBy, db, auth } from "@/lib/db-client";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatInr(amount: number, compact = false): string {
  if (compact && amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

const cardBase =
  "bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden transition-[border-color,background-color] duration-200";
const cardHover = "hover:border-[#144835]/35 active:border-[#144835]/40";
const cardHeader = "px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50/50";

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3 px-0.5">
      <h2 className="erp-label">{title}</h2>
      {action}
    </div>
  );
}

type PendingApprovalItem = {
  id: string;
  kind: "leave" | "expense" | "application";
  title: string;
  subtitle: string;
  appStatus?: "Submitted" | "Verification";
  ts: number;
};

type AdminDashboardProps = {
  schoolId: string;
};

export default function AdminDashboard({ schoolId }: AdminDashboardProps) {
  const base = `/schools/${schoolId}/admin`;
  const { user } = useAuth();
  const { currentYear } = useAcademicYear();
  const { buses } = useBranchTransportBuses(schoolId);
  const { usingTransport } = useBranchTransportStudents(schoolId, currentYear?.name);
  const [now, setNow] = useState(() => new Date());
  const [transportAttendHasMarks, setTransportAttendHasMarks] = useState(false);
  const [transportDriversPresent, setTransportDriversPresent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [activities, setActivities] = useState<{ id: string; text: string; time: string; href: string }[]>([]);
  const [activityBuckets, setActivityBuckets] = useState<Record<string, LiveActivity[]>>({});
  const [events, setEvents] = useState<{ id: string; title?: string; location?: string; date?: unknown }[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [pendingLeaveQueue, setPendingLeaveQueue] = useState<PendingApprovalItem[]>([]);
  const [pendingExpenseQueue, setPendingExpenseQueue] = useState<PendingApprovalItem[]>([]);
  const [pendingApplicationQueue, setPendingApplicationQueue] = useState<PendingApprovalItem[]>([]);
  const [approvalActionId, setApprovalActionId] = useState<string | null>(null);
  const [onLeaveToday, setOnLeaveToday] = useState<
    { id: string; name: string; initials: string; reason: string }[]
  >([]);
  const [feeCollected, setFeeCollected] = useState(0);
  const [feeTarget, setFeeTarget] = useState(0);
  const [feeCollectedAgg, setFeeCollectedAgg] = useState(0);
  const [feeTargetAgg, setFeeTargetAgg] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [teachingStaffCount, setTeachingStaffCount] = useState(0);
  const [nonTeachingCount, setNonTeachingCount] = useState(0);
  const [feesDue, setFeesDue] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [attendancePct, setAttendancePct] = useState(0);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [studentDocs, setStudentDocs] = useState<Record<string, unknown>[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [schoolFacilities, setSchoolFacilities] = useState<string[]>([]);
  const [fleetBusCount, setFleetBusCount] = useState(0);
  const [fleetRouteCount, setFleetRouteCount] = useState(0);
  const [driverPresent, setDriverPresent] = useState(0);
  const [driverTotal, setDriverTotal] = useState(0);
  const [hostelBedTotal, setHostelBedTotal] = useState(0);
  const [hostelBedOccupied, setHostelBedOccupied] = useState(0);

  const setFeedBucket = (key: string, items: LiveActivity[]) => {
    setActivityBuckets((prev) => ({ ...prev, [key]: items }));
  };

  useEffect(() => {
    setActivities(mergeLiveActivities(Object.values(activityBuckets).flat()));
  }, [activityBuckets]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setAttendancePct(computeTodayStudentAttendancePercent(studentDocs, today, holidays));
  }, [studentDocs, holidays]);

  useEffect(() => {
    const yearName = currentYear?.name;
    if (!schoolId || !yearName) {
      setTransportAttendHasMarks(false);
      setTransportDriversPresent(0);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const params = new URLSearchParams({ schoolId, academicYear: yearName, date: today });
    let cancelled = false;

    fetch(`/api/admin/transport/driver-attendance?${params.toString()}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return;
        const marks = (data.marks ?? {}) as Record<string, { status?: string }>;
        const hasMarks = Object.values(marks).some(
          (m) => m?.status === "P" || m?.status === "A" || m?.status === "HD"
        );
        setTransportAttendHasMarks(hasMarks);
        setTransportDriversPresent(Object.values(marks).filter((m) => m?.status === "P").length);
      })
      .catch(() => {
        if (!cancelled) {
          setTransportAttendHasMarks(false);
          setTransportDriversPresent(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const today = new Date().toISOString().split("T")[0];

    unsubs.push(
      subscribeData(buildPath(db, "schools", schoolId), (snap: any) => {
        const facilities = snap.data()?.facilities;
        setSchoolFacilities(Array.isArray(facilities) ? (facilities as string[]) : []);
        setDataReady(true);
      })
    );

    unsubs.push(
      subscribeData(
        buildPath(db, "schools", schoolId, "buses"),
        (snap: any) => setFleetBusCount(snap.size),
        () => setFleetBusCount(0)
      )
    );

    unsubs.push(
      subscribeData(
        buildPath(db, "schools", schoolId, "routes"),
        (snap: any) => {
          const active = snap.docs.filter(
            (d) => String((d.data() as Record<string, unknown>).status ?? "Active") !== "Inactive"
          ).length;
          setFleetRouteCount(active || snap.size);
        },
        () => setFleetRouteCount(0)
      )
    );

    unsubs.push(
      subscribeData(
        buildPath(db, "schools", schoolId, "drivers"),
        (snap: any) => {
          const total = snap.size;
          let present = 0;
          snap.docs.forEach((d: any) => {
            const data = d.data() as Record<string, unknown>;
            if (
              data.presentToday === true ||
              data.status === "Present" ||
              parseDateKey(data.attendanceDate) === today
            ) {
              present++;
            }
          });
          setDriverTotal(total);
          setDriverPresent(present);
        },
        () => {
          setDriverTotal(0);
          setDriverPresent(0);
        }
      )
    );

    unsubs.push(
      subscribeData(
        buildPath(db, "schools", schoolId, "hostel_rooms"),
        (snap: any) => {
          let total = 0;
          let occupied = 0;
          snap.docs.forEach((d: any) => {
            const data = d.data() as Record<string, unknown>;
            const beds = Number(data.totalBeds ?? data.capacity ?? data.beds ?? 0);
            const occ = Number(data.occupiedBeds ?? data.occupied ?? 0);
            total += beds;
            occupied += occ;
          });
          setHostelBedTotal(total);
          setHostelBedOccupied(occupied);
        },
        () => {
          setHostelBedTotal(0);
          setHostelBedOccupied(0);
        }
      )
    );

    unsubs.push(
      subscribeData(buildPath(db, "schools", schoolId, "students"), (snap: any) => {
        setStudentCount(snap.size);
        setStudentDocs(snap.docs.map((d: any) => d.data() as Record<string, unknown>));
        const studentFeed = snap.docs
          .map((d: any) => mapStudentDoc(d.id, d.data() as Record<string, unknown>, base))
          .filter((x): x is LiveActivity => x !== null)
          .sort((a: any, b: any) => b.ts - a.ts)
          .slice(0, 3);
        setFeedBucket("students", studentFeed);
      })
    );

    unsubs.push(
      subscribeData(buildPath(db, "schools", schoolId, "teachers"), (snap: any) => setTeacherCount(snap.size), () => setTeacherCount(0))
    );
    unsubs.push(
      subscribeData(
        buildPath(db, "schools", schoolId, "teaching_staff"),
        (snap: any) => setTeachingStaffCount(snap.size),
        () => setTeachingStaffCount(0)
      )
    );
    unsubs.push(
      subscribeData(
        buildPath(db, "schools", schoolId, "non_teaching_staff"),
        (snap: any) => setNonTeachingCount(snap.size),
        () => setNonTeachingCount(0)
      )
    );
    unsubs.push(subscribeData(buildPath(db, "schools", schoolId, "classes"), (snap: any) => setClassCount(snap.size)));

    unsubs.push(
      subscribeData(buildPath(db, "schools", schoolId, "holidays"), (snap: any) => {
        setHolidays(snap.docs.map((d: any) => String((d.data() as Record<string, unknown>).date ?? "")).filter(Boolean));
      })
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "payments"), sortBy("createdAt", "desc"), limitTo(15)),
        (snap: any) => {
          let monthTotal = 0;
          let allTime = 0;
          snap.docs.forEach((d: any) => {
            const data = d.data() as Record<string, unknown>;
            const amount = Number(data.amount) || 0;
            const status = String(data.status ?? "Completed");
            if (status === "Completed" || status === "Paid") {
              allTime += amount;
              if (isInCurrentMonth(data.createdAt ?? data.date ?? data.updatedAt)) monthTotal += amount;
            }
          });
          setFeeCollected(monthTotal);
          setRevenue(allTime);
          setFeedBucket(
            "payments",
            snap.docs
              .map((d: any) => mapPaymentDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => {
          setFeeCollected(0);
          setRevenue(0);
          setFeedBucket("payments", []);
        }
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "invoices"), sortBy("createdAt", "desc"), limitTo(50)),
        (snap: any) => {
          let due = 0;
          let target = 0;
          snap.docs.forEach((d: any) => {
            const data = d.data() as Record<string, unknown>;
            const amount = Number(data.amount) || 0;
            const paid = Number(data.amountPaid) || 0;
            due += Math.max(0, amount - paid);
            if (isInCurrentMonth(data.dueDate ?? data.createdAt ?? data.date)) target += amount;
          });
          setFeesDue(due);
          setFeeTarget(target);
        },
        () => {
          setFeesDue(0);
          setFeeTarget(0);
        }
      )
    );

    unsubs.push(
      subscribeData(buildPath(db, "schools", schoolId, "fee_collections"), (snap: any) => {
        let collected = 0;
        let expected = 0;
        snap.docs.forEach((d: any) => {
          const data = d.data() as Record<string, unknown>;
          collected += Number(data.collected) || 0;
          expected += Number(data.expected) || 0;
        });
        setFeeCollectedAgg(collected);
        setFeeTargetAgg(expected);
      }, () => {
        setFeeCollectedAgg(0);
        setFeeTargetAgg(0);
      })
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "events"), sortBy("date", "asc"), limitTo(20)),
        (snap: any) => {
          const upcoming = snap.docs
            .map((d: any) => ({ id: d.id, ...d.data() } as { id: string; date?: unknown }))
            .filter((ev) => isUpcomingEvent(ev.date, today))
            .slice(0, 3);
          setEvents(upcoming);
          setFeedBucket(
            "events",
            snap.docs
              .map((d: any) => mapEventCreatedDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => {
          setEvents([]);
          setFeedBucket("events", []);
        }
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "leaves"), sortBy("createdAt", "desc"), limitTo(15)),
        (snap: any) => {
          setFeedBucket(
            "leaves",
            snap.docs
              .map((d: any) => mapLeaveDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
          setOnLeaveToday(
            snap.docs
              .filter((d) => {
                const data = d.data() as Record<string, string>;
                if (String(data.status) !== "Approved") return false;
                const start = data.from ?? data.startDate ?? "";
                const end = data.to ?? data.endDate ?? today;
                return start <= today && end >= today;
              })
              .slice(0, 5)
              .map((d: any) => {
                const data = d.data() as Record<string, string>;
                const name = data.employeeName ?? data.name ?? "Staff";
                return {
                  id: d.id,
                  name,
                  initials: name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                  reason: data.leaveType ?? data.type ?? data.reason ?? "Leave",
                };
              })
          );
        },
        () => {
          setOnLeaveToday([]);
          setFeedBucket("leaves", []);
        }
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "leaves"), filterBy("status", "==", "Pending")),
        (snap: any) => {
          const items = snap.docs
            .map((d: any) => {
              const data = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                kind: "leave" as const,
                title: String(data.employeeName ?? data.name ?? "Staff"),
                subtitle: String(data.leaveType ?? data.type ?? "Leave request"),
                ts: toMillis(data.createdAt),
              };
            })
            .sort((a: any, b: any) => b.ts - a.ts);
          setPendingLeaveQueue(items);
          setPendingLeaves(snap.size);
        },
        () => {
          setPendingLeaveQueue([]);
          setPendingLeaves(0);
        }
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "expenses"), sortBy("createdAt", "desc"), limitTo(15)),
        (snap: any) => {
          setFeedBucket(
            "expenses",
            snap.docs
              .map((d: any) => mapExpenseDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => setFeedBucket("expenses", [])
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "expenses"), filterBy("status", "==", "Pending")),
        (snap: any) => {
          const items = snap.docs
            .map((d: any) => {
              const data = d.data() as Record<string, unknown>;
              const amount = Number(data.amount) || 0;
              return {
                id: d.id,
                kind: "expense" as const,
                title: String(data.title ?? data.description ?? data.category ?? "Expense"),
                subtitle: `₹${amount.toLocaleString("en-IN")}`,
                ts: toMillis(data.createdAt),
              };
            })
            .sort((a: any, b: any) => b.ts - a.ts);
          setPendingExpenseQueue(items);
          setPendingExpenses(snap.size);
        },
        () => {
          setPendingExpenseQueue([]);
          setPendingExpenses(0);
        }
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "applications"), sortBy("createdAt", "desc"), limitTo(15)),
        (snap: any) => {
          setFeedBucket(
            "applications",
            snap.docs
              .map((d: any) => mapApplicationDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => setFeedBucket("applications", [])
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "applications"), sortBy("createdAt", "desc")),
        (snap: any) => {
          const items = snap.docs
            .filter((d) => {
              const status = String((d.data() as Record<string, unknown>).status ?? "");
              return status === "Submitted" || status === "Verification";
            })
            .map((d: any) => {
              const data = d.data() as Record<string, unknown>;
              const status = String(data.status) as "Submitted" | "Verification";
              return {
                id: d.id,
                kind: "application" as const,
                title: String(data.studentName ?? data.name ?? "Applicant"),
                subtitle: status === "Submitted" ? "New application" : "Ready to select",
                appStatus: status,
                ts: toMillis(data.createdAt),
              };
            })
            .sort((a: any, b: any) => b.ts - a.ts);
          setPendingApplicationQueue(items);
          setPendingApplications(items.length);
        },
        () => {
          setPendingApplicationQueue([]);
          setPendingApplications(0);
        }
      )
    );

    unsubs.push(
      subscribeData(
        buildQuery(buildPath(db, "schools", schoolId, "messages"), sortBy("createdAt", "desc"), limitTo(10)),
        (snap: any) => {
          setFeedBucket(
            "messages",
            snap.docs
              .map((d: any) => mapMessageDoc(d.id, d.data() as Record<string, unknown>, base))
              .filter((x): x is LiveActivity => x !== null)
              .slice(0, 5)
          );
        },
        () => setFeedBucket("messages", [])
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [schoolId, base]);

  const staffCount = useMemo(
    () => Math.max(teacherCount, teachingStaffCount) + nonTeachingCount,
    [teacherCount, teachingStaffCount, nonTeachingCount]
  );

  const displayFeeCollected = feeCollected > 0 ? feeCollected : feeCollectedAgg;
  const displayFeeTarget = feeTarget > 0 ? feeTarget : feeTargetAgg;
  const feePercent =
    displayFeeTarget > 0 ? Math.min(100, Math.round((displayFeeCollected / displayFeeTarget) * 100)) : 0;
  const staffPresent = Math.max(0, staffCount - onLeaveToday.length);
  const staffAttendancePct = staffCount > 0 ? Math.round((staffPresent / staffCount) * 100) : 0;
  const pendingTotal = pendingLeaves + pendingExpenses + pendingApplications;

  const transportHostel = useMemo(() => {
    const derived = computeTransportHostelMetrics(studentDocs, now.getMonth());
    const monthIndex = now.getMonth();

    const activeFleetBuses = buses.filter((b) => b.status === "Active");
    const fleetRoutes = new Set(activeFleetBuses.map((b) => b.route).filter(Boolean));
    const fleetDrivers = new Set(
      usingTransport.map((s) => s.driverName?.trim()).filter((n): n is string => Boolean(n && n !== "—"))
    );

    const totalBuses =
      activeFleetBuses.length > 0 ? activeFleetBuses.length : fleetBusCount || derived.busNos.size;
    const activeRoutes =
      fleetRoutes.size > 0 ? fleetRoutes.size : fleetRouteCount || derived.routeNames.size;
    const studentsUsingTransport =
      usingTransport.length > 0 ? usingTransport.length : derived.studentsUsingTransport;
    const driversAssigned =
      fleetDrivers.size > 0 ? fleetDrivers.size : driverTotal || derived.driversAssigned;

    const driverPresentCount =
      fleetDrivers.size > 0 && transportAttendHasMarks
        ? transportDriversPresent
        : transportAttendHasMarks
          ? 0
          : driverPresent;
    const driverAttendancePct =
      driversAssigned > 0 && (transportAttendHasMarks || driverPresent > 0)
        ? Math.round((driverPresentCount / driversAssigned) * 100)
        : 0;

    const supabaseTransportFeePending = usingTransport.reduce((sum, student) => {
      const fees = student.transportFees;
      if (!Array.isArray(fees) || fees.length === 0) return sum;
      return sum + (fees[monthIndex] || 0);
    }, 0);
    const transportFeePending =
      usingTransport.length > 0 ? supabaseTransportFeePending : derived.transportFeePending;

    const totalBeds = hostelBedTotal || derived.hostelStudents;
    const occupiedBeds = hostelBedOccupied || derived.hostelStudents;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const roomOccupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalBuses,
      activeRoutes,
      studentsUsingTransport,
      driversAssigned,
      driverAttendancePct,
      driverAttendanceKnown: transportAttendHasMarks || driverPresent > 0,
      transportFeePending,
      hostelStudents: derived.hostelStudents,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      roomOccupancyPct,
      hostelFeePending: derived.hostelFeePending,
    };
  }, [
    studentDocs,
    now,
    buses,
    usingTransport,
    fleetBusCount,
    fleetRouteCount,
    driverTotal,
    driverPresent,
    transportAttendHasMarks,
    transportDriversPresent,
    hostelBedTotal,
    hostelBedOccupied,
  ]);

  const showHostel =
    schoolFacilities.includes("hostel") ||
    transportHostel.hostelStudents > 0 ||
    transportHostel.totalBeds > 0;

  const userName = user?.displayName || user?.email?.split("@")[0] || "Admin";

  const dateLabel = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeLabel = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const currentMonth = now.toLocaleString("default", { month: "long" });

  const kpis = useMemo(
    () => [
      { label: "Students", short: "Students", value: studentCount.toLocaleString("en-IN"), icon: GraduationCap, href: `${base}/academic/students`, accent: "emerald" },
      { label: "Staff", short: "Staff", value: staffCount.toLocaleString("en-IN"), icon: Users, href: `${base}/hr/teaching-staff`, accent: "blue" },
      { label: "Revenue", short: "Revenue", value: formatInr(revenue, true), icon: Wallet, href: `${base}/finance/payments`, accent: "amber" },
      { label: "Classes", short: "Classes", value: classCount.toLocaleString("en-IN"), icon: BookOpen, href: `${base}/academic/classes`, accent: "violet" },
      { label: "Fees Due", short: "Due", value: formatInr(feesDue, true), icon: Clock, href: `${base}/finance/fees`, accent: "rose" },
      { label: "Attendance", short: "Attend.", value: `${attendancePct}%`, icon: CalendarCheck, href: `${base}/academic/attendance`, accent: "teal" },
    ],
    [studentCount, staffCount, revenue, classCount, feesDue, attendancePct, base]
  );

  const accentMap: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-600", border: "border-emerald-200 hover:border-emerald-400" },
    blue: { bg: "bg-blue-500/10", icon: "text-blue-600", border: "border-blue-200 hover:border-blue-400" },
    amber: { bg: "bg-amber-500/10", icon: "text-amber-600", border: "border-amber-200 hover:border-amber-400" },
    violet: { bg: "bg-violet-500/10", icon: "text-violet-600", border: "border-violet-200 hover:border-violet-400" },
    rose: { bg: "bg-rose-500/10", icon: "text-rose-600", border: "border-rose-200 hover:border-rose-400" },
    teal: { bg: "bg-teal-500/10", icon: "text-teal-600", border: "border-teal-200 hover:border-teal-400" },
  };

  const pendingApprovalItems = useMemo(
    () =>
      [...pendingLeaveQueue, ...pendingExpenseQueue, ...pendingApplicationQueue]
        .sort((a: any, b: any) => b.ts - a.ts)
        .slice(0, 8),
    [pendingLeaveQueue, pendingExpenseQueue, pendingApplicationQueue]
  );

  const handleLeaveAction = async (id: string, status: "Approved" | "Rejected") => {
    setApprovalActionId(id);
    try {
      await patchData(buildPath(db, "schools", schoolId, "leaves", id), { status, updatedAt: new Date() });
    } catch (err) {
      console.error("Failed to update leave", err);
    } finally {
      setApprovalActionId(null);
    }
  };

  const handleExpenseApprove = async (id: string) => {
    setApprovalActionId(id);
    try {
      await patchData(buildPath(db, "schools", schoolId, "expenses", id), { status: "Paid", updatedAt: new Date() });
    } catch (err) {
      console.error("Failed to approve expense", err);
    } finally {
      setApprovalActionId(null);
    }
  };

  const handleApplicationAdvance = async (id: string, current: "Submitted" | "Verification") => {
    setApprovalActionId(id);
    try {
      const next = current === "Submitted" ? "Verification" : "Selected";
      await patchData(buildPath(db, "schools", schoolId, "applications", id), { status: next, updatedAt: new Date() });
    } catch (err) {
      console.error("Failed to update application", err);
    } finally {
      setApprovalActionId(null);
    }
  };

  const quickLinks = [
    { label: "Add student", href: `${base}/academic/students/new`, icon: UserPlus },
    { label: "Mark attendance", href: `${base}/academic/attendance`, icon: CalendarCheck },
    { label: "Record payment", href: `${base}/finance/payments/new`, icon: Wallet },
    { label: "Review leaves", href: `${base}/hr/leaves`, icon: ClipboardList },
  ];

  const mobileHighlights = [
    { label: "Attendance", value: `${attendancePct}%`, href: `${base}/academic/attendance`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { label: "Fees", value: `${feePercent}%`, href: `${base}/finance/payments`, color: "text-[#144835] bg-[#144835]/5 border-[#144835]/20" },
    { label: "Pending", value: String(pendingTotal), href: `${base}/hr/leaves`, color: "text-rose-700 bg-rose-50 border-rose-200" },
    { label: "On leave", value: String(onLeaveToday.length), href: `${base}/hr/leaves`, color: "text-amber-700 bg-amber-50 border-amber-200" },
  ];

  return (
    <div className="erp-body space-y-4 sm:space-y-6 animate-in fade-in duration-500 font-jost pb-20 sm:pb-24 max-w-[1600px] mx-auto -mx-0.5 sm:mx-auto">
      {/* Welcome bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{getGreeting()},</p>
          <h1 className="erp-page-title mt-0.5 truncate">{userName}</h1>
        </div>
        <div className="inline-flex items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shrink-0 whitespace-nowrap">
          <span className="font-medium text-gray-700">{dateLabel}</span>
          <span className="text-gray-300" aria-hidden="true">·</span>
          <span className="text-gray-500 tabular-nums">{timeLabel}</span>
        </div>
      </div>

      {/* Mobile / narrow: at-a-glance chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden -mx-0.5 px-0.5">
        {mobileHighlights.map((chip) => (
          <SafeLink
            key={chip.label}
            href={chip.href}
            className={cn(
              "snap-start shrink-0 flex flex-col min-w-[88px] px-3 py-2.5 rounded-xl border font-bold transition-colors",
              chip.color
            )}
          >
            <span className="text-xs uppercase tracking-wider opacity-80">{chip.label}</span>
            <span className="erp-metric text-base mt-0.5">{chip.value}</span>
          </SafeLink>
        ))}
      </div>

      {/* KPIs — scroll on mobile & md (minimized sidebar), grid on xl */}
      <section>
        {/* Mobile + tablet + collapsed sidebar */}
        <div className="xl:hidden -mx-0.5">
          <div className="flex gap-2.5 overflow-x-auto pb-1 px-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!dataReady
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="snap-start shrink-0 w-[132px] h-[92px] rounded-xl bg-white border border-gray-200 animate-pulse" />
                ))
              : kpis.map((stat) => {
                  const a = accentMap[stat.accent];
                  return (
                    <SafeLink
                      key={stat.label}
                      href={stat.href}
                      className={cn(
                        "snap-start shrink-0 w-[132px] rounded-xl p-3 border bg-white flex flex-col justify-between min-h-[92px]",
                        a.border
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", a.bg, a.icon)}>
                          <stat.icon size={16} strokeWidth={2} />
                        </div>
                        <ArrowUpRight size={12} className="text-gray-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate">{stat.short}</p>
                        <p className="erp-metric text-base truncate">{stat.value}</p>
                      </div>
                    </SafeLink>
                  );
                })}
          </div>
        </div>

        {/* Full width desktop */}
        <div className="hidden xl:grid grid-cols-6 gap-3">
          {!dataReady
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[100px] rounded-2xl bg-white border border-gray-200 animate-pulse" />
              ))
            : kpis.map((stat) => {
                const a = accentMap[stat.accent];
                return (
                  <SafeLink
                    key={stat.label}
                    href={stat.href}
                    className={cn("group rounded-2xl p-4 border bg-white transition-colors", a.border, cardHover)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", a.bg, a.icon)}>
                        <stat.icon size={18} strokeWidth={2} />
                      </div>
                      <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[#144835] transition-colors" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="erp-metric text-xl mt-0.5">{stat.value}</p>
                  </SafeLink>
                );
              })}
        </div>
      </section>

      {/* Overview */}
      <section>
        <SectionHeading title="Today's overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start">
          <SafeLink href={`${base}/academic/attendance`} className={cn(cardBase, cardHover, "block self-start")}>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
                    <CalendarCheck size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="erp-section-title text-gray-900">Attendance</h3>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  Live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Students", pct: attendancePct, color: "bg-emerald-500" },
                  { label: "Staff", pct: staffAttendancePct, color: "bg-blue-500" },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-2">
                    <p className="text-xs text-gray-500">{row.label}</p>
                    <p className="erp-metric text-base leading-tight">{row.pct}%</p>
                    <div className="mt-1.5 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", row.color)} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SafeLink>

          <SafeLink href={`${base}/finance/payments`} className={cn(cardBase, cardHover, "block self-start")}>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center border border-[#144835]/15 shrink-0">
                    <Wallet size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="erp-section-title text-gray-900">Fee buildPath</h3>
                    <p className="text-xs text-gray-500">{currentMonth}</p>
                  </div>
                </div>
                <span className="erp-metric text-lg text-[#144835] shrink-0">{feePercent}%</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-500">Collected</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{formatInr(displayFeeCollected, true)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-500">Target</span>
                  <span className="font-semibold text-gray-700 tabular-nums">{formatInr(displayFeeTarget, true)}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#144835] rounded-full transition-all"
                    style={{ width: `${feePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </SafeLink>
        </div>
      </section>

      {/* Activity + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 items-start">
        <div className="xl:col-span-2 flex flex-col gap-3 min-w-0 self-start">
          <div className={cn("grid gap-3", showHostel ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1")}>
            {/* Transport Management */}
            <div className={cn(cardBase, "flex flex-col")}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0 border border-[#144835]/20">
                    <Bus size={16} />
                  </div>
                  <h3 className="erp-section-title text-gray-900">Transport Management</h3>
                </div>
                <SafeLink href={`${base}/transport`} className="text-xs font-semibold text-[#144835] hover:underline">Manage</SafeLink>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Total Buses", value: String(transportHostel.totalBuses), icon: Bus },
                  { label: "Active Routes", value: String(transportHostel.activeRoutes), icon: MapPin },
                  { label: "Students", value: String(transportHostel.studentsUsingTransport), icon: Users },
                  {
                    label: "Driver Attend.",
                    value:
                      transportHostel.driversAssigned > 0 && transportHostel.driverAttendanceKnown
                        ? `${transportHostel.driverAttendancePct}%`
                        : "—",
                    icon: CalendarCheck
                  },
                  {
                    label: "Fee Pending",
                    value: formatInr(transportHostel.transportFeePending, true),
                    icon: Wallet
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 flex flex-col justify-between group hover:border-[#144835]/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <item.icon size={14} className="text-gray-400 group-hover:text-[#144835] transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">{item.label}</p>
                      <p className="text-lg font-bold text-gray-900 tabular-nums leading-tight mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hostel Management */}
            {showHostel && (
              <div className={cardBase}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <Building2 size={16} className="text-[#144835] shrink-0" />
                  <h3 className="erp-section-title text-gray-900">Hostel Management</h3>
                </div>
                <div className="grid grid-cols-2 gap-px bg-gray-100">
                  {[
                    { label: "Hostel Students", value: String(transportHostel.hostelStudents) },
                    {
                      label: "Room Occupancy",
                      value: transportHostel.totalBeds > 0 ? `${transportHostel.roomOccupancyPct}%` : "—",
                    },
                    { label: "Vacant Beds", value: String(transportHostel.vacantBeds) },
                    {
                      label: "Fee Pending",
                      value: formatInr(transportHostel.hostelFeePending, true),
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-white px-3 py-2.5">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="erp-metric text-base mt-0.5 tabular-nums">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={cardBase}>
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Activity size={16} />
              </div>
              <h2 className="erp-section-title text-gray-900">Recent activity</h2>
            </div>
            <button
              type="button"
              onClick={() => setLogOpen(true)}
              className="text-xs font-semibold text-[#144835] hover:underline inline-flex items-center gap-0.5 shrink-0"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          {activities.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Activity size={20} className="mx-auto text-gray-300 mb-1.5" />
              <p className="text-sm text-gray-500">No activity yet</p>
            </div>
          ) : (
            <div className="relative py-2">
              <div className="absolute left-7 top-4 bottom-4 w-px bg-gray-100 hidden sm:block"></div>
              <ul className="relative">
                {activities.slice(0, 5).map((activity) => (
                  <li key={activity.id} className="relative">
                    <SafeLink
                      href={activity.href}
                      className="flex items-start sm:items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="h-6 w-6 rounded-full border-4 border-white bg-gray-100 group-hover:bg-[#144835] shrink-0 z-10 transition-colors shadow-sm hidden sm:block mt-0.5 sm:mt-0" />
                      <div className="h-2 w-2 rounded-full bg-[#144835] shrink-0 mt-1.5 sm:hidden" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-[#144835] transition-colors line-clamp-2 sm:line-clamp-1">
                          {activity.text}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 sm:hidden">{activity.time}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 shrink-0 hidden sm:block bg-white px-2.5 py-1 rounded-full border border-gray-100">{activity.time}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#144835] shrink-0 hidden sm:block ml-2" />
                    </SafeLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0 self-start">
          <div className={cardBase}>
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="erp-section-title text-gray-900">Quick actions</h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <SafeLink
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center justify-center text-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-[#144835]/5 hover:border-[#144835]/30 transition-all group gap-2"
                >
                  <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-[#144835]/30 group-hover:text-[#144835] text-gray-500 transition-colors shadow-sm">
                    <link.icon size={18} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-[#144835] transition-colors leading-tight">{link.label}</span>
                </SafeLink>
              ))}
            </div>
          </div>

          <div className={cardBase}>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
              <div className="min-w-0">
                <h3 className="erp-section-title text-gray-900">Approvals</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pendingLeaves} leaves · {pendingExpenses} expenses · {pendingApplications} admissions
                </p>
              </div>
              {pendingTotal > 0 && (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                  {pendingTotal}
                </span>
              )}
            </div>
            {pendingApprovalItems.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">No pending approvals</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingApprovalItems.map((item) => {
                  const busy = approvalActionId === item.id;
                  return (
                    <li key={`${item.kind}-${item.id}`} className="px-4 py-2.5">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.kind === "leave" && (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleLeaveAction(item.id, "Approved")}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                title="Approve leave"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleLeaveAction(item.id, "Rejected")}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                title="Reject leave"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {item.kind === "expense" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleExpenseApprove(item.id)}
                              className="h-7 px-2 inline-flex items-center justify-center rounded-lg text-xs font-semibold text-[#144835] bg-[#144835]/10 hover:bg-[#144835] hover:text-white disabled:opacity-50"
                            >
                              Pay
                            </button>
                          )}
                          {item.kind === "application" && item.appStatus && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleApplicationAdvance(item.id, item.appStatus!)}
                              className="h-7 px-2 inline-flex items-center justify-center rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {item.appStatus === "Submitted" ? "Verify" : "Select"}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex border-t border-gray-100 divide-x divide-gray-100">
              <SafeLink
                href={`${base}/hr/leaves`}
                className="flex-1 py-2.5 text-center text-xs font-semibold text-gray-600 hover:text-[#144835] hover:bg-gray-50"
              >
                Leaves
              </SafeLink>
              <SafeLink
                href={`${base}/finance/expenses`}
                className="flex-1 py-2.5 text-center text-xs font-semibold text-gray-600 hover:text-[#144835] hover:bg-gray-50"
              >
                Expenses
              </SafeLink>
              <SafeLink
                href={`${base}/admission/applications`}
                className="flex-1 py-2.5 text-center text-xs font-semibold text-gray-600 hover:text-[#144835] hover:bg-gray-50"
              >
                Admissions
              </SafeLink>
            </div>
          </div>

          <div className={cardBase}>
            <div className={cn(cardHeader, "flex items-center justify-between")}>
              <h3 className="erp-section-title text-gray-900">Events</h3>
              <SafeLink
                href={`${base}/academic/calendar/new`}
                className="h-7 w-7 rounded-full bg-[#144835] text-white flex items-center justify-center border-2 border-[#0f3628]"
                aria-label="Add event"
              >
                <Plus size={14} />
              </SafeLink>
            </div>
            <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              {events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center">
                  <p className="text-sm text-gray-500">No events scheduled</p>
                </div>
              ) : (
                events.map((ev) => {
                  const d =
                    ev.date &&
                    typeof ev.date === "object" &&
                    "toDate" in ev.date &&
                    typeof (ev.date as { toDate: () => Date }).toDate === "function"
                      ? (ev.date as { toDate: () => Date }).toDate()
                      : new Date(ev.date as string);
                  const month = d.toLocaleString("default", { month: "short" }).toUpperCase();
                  const day = d.getDate().toString().padStart(2, "0");
                  return (
                    <div key={ev.id} className="flex items-center gap-2.5 sm:gap-3">
                      <div className="h-10 w-10 rounded-lg border border-gray-200 bg-white flex flex-col items-center overflow-hidden shrink-0">
                        <div className="w-full text-center py-0.5 text-xs font-bold text-gray-500 bg-gray-50 border-b border-gray-200">{month}</div>
                        <div className="text-xs font-bold text-gray-900 flex-1 flex items-center">{day}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">{ev.title}</p>
                        {ev.location && (
                          <p className="text-xs text-gray-500 truncate flex items-center gap-0.5 mt-0.5">
                            <MapPin size={9} className="shrink-0" /> {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <SafeLink
                href={`${base}/academic/calendar`}
                className="h-9 sm:h-10 inline-flex items-center justify-center w-full rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Full calendar
              </SafeLink>
            </div>
          </div>
        </div>
      </div>

      {logOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close activity log"
            className="absolute inset-0 bg-black/40"
            onClick={() => setLogOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-full sm:max-w-[400px] lg:max-w-[440px] bg-white border-l-2 border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase">Activity</p>
                <h3 className="erp-section-title text-base text-gray-900 truncate">Full log</h3>
              </div>
              <button
                type="button"
                onClick={() => setLogOpen(false)}
                className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200"
              >
                <X size={14} />
              </button>
            </div>
            <ul className="overflow-auto flex-1 divide-y divide-gray-100">
              {activities.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-gray-400">No activity recorded yet.</li>
              ) : (
                activities.map((item) => (
                  <li key={item.id}>
                    <SafeLink
                      href={item.href}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setLogOpen(false)}
                    >
                      <span className="flex-1 min-w-0 text-sm text-gray-800">{item.text}</span>
                      <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
                    </SafeLink>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
