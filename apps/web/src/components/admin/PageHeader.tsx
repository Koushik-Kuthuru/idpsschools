import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate">{title}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{description}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
