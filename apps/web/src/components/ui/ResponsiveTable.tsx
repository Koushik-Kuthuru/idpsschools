import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Wrap wide ERP tables so they scroll horizontally on phones/tablets. */
export default function ResponsiveTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("erp-table-scroll", className)}>{children}</div>;
}
