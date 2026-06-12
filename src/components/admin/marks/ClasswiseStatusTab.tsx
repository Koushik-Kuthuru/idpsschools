import React from "react";
import { PieChart } from "lucide-react";

export default function ClasswiseStatusTab() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <PieChart size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Marks Status (Classwise)</h2>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          This section is currently under development. Here you will be able to see the overall entry status of marks per class and section.
        </p>
      </div>
    </div>
  );
}
