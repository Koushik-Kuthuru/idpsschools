"use client";

import { useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MigratePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const runMigration = async () => {
    setIsRunning(true);
    setLogs(["Starting Migration..."]);

    try {
      // 1. Fetch Schools
      addLog("Fetching schools from Firebase...");
      const schoolsSnap = await getDocs(collection(db, "schools"));
      const schools = schoolsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      addLog(`Found ${schools.length} schools.`);

      // 2. Fetch Super Admins
      addLog("Fetching super admins from Firebase...");
      const superAdminsSnap = await getDocs(collection(db, "super_admin_users"));
      const superAdmins = superAdminsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: "super_admin"
      }));

      // Send schools and super admins to API
      addLog("Migrating schools and super admins to Supabase...");
      let res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "core", schools, superAdmins })
      });
      if (!res.ok) throw new Error(await res.text());
      addLog("✅ Schools and Super Admins migrated!");

      // 3. Loop through schools and migrate nested collections
      for (const school of schools) {
        addLog(`--- Migrating data for school: ${school.id} ---`);

        // Fetch teachers
        const teachersSnap = await getDocs(collection(db, "schools", school.id, "teachers"));
        const teachers = teachersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        addLog(`Found ${teachers.length} teachers.`);

        // Fetch non_teaching_staff
        const staffSnap = await getDocs(collection(db, "schools", school.id, "non_teaching_staff"));
        const staff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        addLog(`Found ${staff.length} non-teaching staff.`);

        // Fetch students
        const studentsSnap = await getDocs(collection(db, "schools", school.id, "students"));
        const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        addLog(`Found ${students.length} students.`);

        // Send school data to API
        res = await fetch("/api/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "school_data", schoolId: school.id, teachers, staff, students })
        });
        if (!res.ok) throw new Error(await res.text());
        addLog(`✅ School ${school.id} data migrated!`);
      }

      addLog("🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!");
    } catch (err: any) {
      console.error(err);
      addLog(`❌ ERROR: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-4">Firebase ➡️ Supabase Migration</h1>
      <p className="mb-6 text-gray-600">
        This tool extracts data directly from Firebase and inserts it into Supabase via a secure API route.
        User accounts will be created using their ID (e.g., EMP1008) mapped to a dummy email (`EMP1008@idps.local`).
        Their password will be their existing Firebase `portalPassword` or a default of `Welcome@123`.
      </p>

      <button
        onClick={runMigration}
        disabled={isRunning}
        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50"
      >
        {isRunning ? "Migrating..." : "Run Migration"}
      </button>

      <div className="mt-8 bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm shadow-inner">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}
