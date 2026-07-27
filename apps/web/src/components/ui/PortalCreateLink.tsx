"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePortalActions } from "@/contexts/PortalActionContext";

const SafeLink = Link as React.ComponentType<ComponentProps<typeof Link>>;

type PortalCreateLinkProps = ComponentProps<typeof Link>;

export default function PortalCreateLink({ children, ...props }: PortalCreateLinkProps) {
  const { canCreate, loading } = usePortalActions();
  if (loading || !canCreate) return null;
  return <SafeLink {...props}>{children}</SafeLink>;
}
