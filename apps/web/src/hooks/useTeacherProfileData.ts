"use client";

import { useEffect, useState } from "react";
import { buildPath, fetchOne, fetchMany, buildQuery, db } from "@/lib/db-client";
import { matchesEmployeeRecord } from "@/lib/teacherProfileHub";
import type { PayslipRow } from "@/lib/teacherProfileHub";

export function useTeacherRawEmployee(
  schoolId: string,
  uid: string | null,
  employeeId: string,
  name: string | null,
  email: string | null
) {
  const [rawEmployee, setRawEmployee] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!schoolId || !uid) return;
    let cancelled = false;

    (async () => {
      for (const col of ["teachers", "teaching_staff", "staff", "employees"] as const) {
        const byId = await fetchOne(buildPath(db, "schools", schoolId, col, uid));
        if (!cancelled && byId.exists()) {
          setRawEmployee(byId.data() as Record<string, unknown>);
          return;
        }
      }

      for (const col of ["teachers", "teaching_staff", "staff", "employees"] as const) {
        const snap = await fetchMany(buildQuery(buildPath(db, "schools", schoolId, col)));
        const match = snap.docs.find((d: { id: string; data: () => Record<string, unknown> }) =>
          matchesEmployeeRecord(d.data(), d.id, uid, employeeId, name, email)
        );
        if (!cancelled && match) {
          setRawEmployee(match.data() as Record<string, unknown>);
          return;
        }
      }

      if (!cancelled) setRawEmployee(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolId, uid, employeeId, name, email]);

  return rawEmployee;
}

export function useTeacherPayslips(
  schoolId: string,
  uid: string | null,
  employeeId: string,
  name: string | null,
  email: string | null,
  rawEmployee: Record<string, unknown> | null
) {
  const [payslips, setPayslips] = useState<PayslipRow[]>([]);

  useEffect(() => {
    const embedded = rawEmployee?.payslips;
    if (Array.isArray(embedded) && embedded.length > 0) {
      setPayslips(
        embedded.map((row, index) => {
          const ps = row as Record<string, unknown>;
          return {
            id: String(ps.id ?? `ps-${index}`),
            period: String(ps.month ?? ps.period ?? "—"),
            salary: Number(ps.gross ?? ps.salary ?? 0),
            tds: Number(ps.tds ?? 0),
            deduct: Number(ps.deduct ?? ps.deductions ?? 0),
            net: Number(ps.netPay ?? ps.net ?? 0),
            status: String(ps.status ?? "Processed"),
          };
        })
      );
      return;
    }

    if (!schoolId) return;
    let cancelled = false;

    (async () => {
      const snap = await fetchMany(buildQuery(buildPath(db, "schools", schoolId, "payroll")));
      const rows: PayslipRow[] = snap.docs
        .filter((d: { id: string; data: () => Record<string, unknown> }) => {
          const data = d.data();
          const empId = String(data.employeeId ?? data.employee_id_ref ?? "");
          const empName = String(data.employeeName ?? data.employee_name ?? "");
          if (uid && empId === uid) return true;
          if (employeeId && empId === employeeId) return true;
          if (name && empName.toLowerCase().includes(name.toLowerCase())) return true;
          return matchesEmployeeRecord(data, d.id, uid, employeeId, name, email);
        })
        .map((d: { id: string; data: () => Record<string, unknown> }) => {
          const data = d.data();
          const salary = Number(data.salary ?? data.amount ?? 0);
          const tds = Number(data.tds ?? 0);
          const deduct = Number(data.deductions ?? data.deduct ?? 0);
          const net = Number(data.netSalary ?? data.net ?? salary - tds - deduct);
          return {
            id: d.id,
            period: String(data.period ?? data.payrollPeriod ?? "—"),
            salary,
            tds,
            deduct,
            net,
            status: String(data.status ?? "Processed"),
          };
        });
      if (!cancelled) setPayslips(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolId, uid, employeeId, name, email, rawEmployee]);

  return payslips;
}

export function useTeacherAttendanceDates(rawEmployee: Record<string, unknown> | null) {
  const attendance = rawEmployee?.attendance as { presentDates?: string[]; absentDates?: string[] } | undefined;
  return {
    presentDates: Array.isArray(attendance?.presentDates) ? attendance.presentDates : [],
    absentDates: Array.isArray(attendance?.absentDates) ? attendance.absentDates : [],
  };
}
