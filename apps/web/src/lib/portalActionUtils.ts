import type { RowActionItem } from "@/components/ui/TableRowActions";
import type { PermissionAction } from "@/lib/portalPermissionsStore";

export function inferRowActionPermission(item: RowActionItem): PermissionAction {
  const label = item.label.toLowerCase();
  const href = String(item.href ?? "").toLowerCase();

  if (item.destructive || label.includes("delete") || label.includes("remove")) {
    return "delete";
  }
  if (label.includes("approve") || label.includes("accept") || label.includes("reject")) {
    return "approve";
  }
  if (label.includes("export") || label.includes("download") || label.includes("print")) {
    return "export";
  }
  if (label.includes("edit") || href.includes("/edit")) {
    return "edit";
  }
  if (
    label.includes("add") ||
    label.includes("create") ||
    label.includes("new") ||
    href.includes("/new")
  ) {
    return "create";
  }
  if (label.includes("view") || label.includes("profile") || label.includes("open")) {
    return "view";
  }
  return "edit";
}

export function inferHrefActionPermission(href: string): PermissionAction {
  const path = href.toLowerCase();
  if (path.includes("/new")) return "create";
  if (path.includes("/edit")) return "edit";
  return "view";
}
