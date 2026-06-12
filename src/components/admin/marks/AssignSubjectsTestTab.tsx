import React from "react";
import { BookOpen } from "lucide-react";

export default function AssignSubjectsTestTab() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
          <BookOpen size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Assign Subjects & Test</h2>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          This section is currently under development. Here you will be able to map subjects to classes and set up test structures.
        </p>
      </div>
    </div>
  );
}
