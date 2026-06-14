import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 tracking-tight truncate">{title}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{description}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end mt-2 xl:mt-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
