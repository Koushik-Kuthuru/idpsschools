import React from "react";
import { History } from "lucide-react";

export default function MarksUpdateLogTab() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
          <History size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Marks Update Log</h2>
        <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
          This section is currently under development. Here you will be able to track history of changes and updates to student marks.
        </p>
      </div>
    </div>
  );
}
