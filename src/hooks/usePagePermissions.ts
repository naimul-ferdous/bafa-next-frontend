"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Menu, Permission } from "@/libs/types/menu";

const normalizeRoute = (path: string) => path.replace(/\/+$/, "");

function findMenuByRoute(menus: Menu[], pathname: string): Menu | null {
  const normalized = normalizeRoute(pathname);
  for (const menu of menus) {
    if (menu.route && normalizeRoute(menu.route) === normalized) {
      return menu;
    }
    if (menu.children && menu.children.length > 0) {
      const found = findMenuByRoute(menu.children, pathname);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Returns the permissions the current user has for this page's menu.
 * Intersects the menu's assigned permissions with the user's own role permissions.
 */
export function usePagePermissions(): Permission[] {
  const { menus, user } = useAuth();
  const pathname = usePathname();

  return useMemo(() => {
    const menu = findMenuByRoute(menus, pathname);
    const menuPermissions = menu?.permissions ?? [];
    if (menuPermissions.length === 0) return [];

    // Build set of slugs the user actually has (from all their roles)
    const userSlugs = new Set<string>();
    (user?.roles ?? []).forEach((role: any) => {
      (role.permissions ?? []).forEach((p: any) => userSlugs.add(p.slug));
    });

    // Return only menu permissions the user actually holds
    return menuPermissions.filter((p) => userSlugs.has(p.slug));
  }, [menus, pathname, user]);
}

/**
 * Convenience: check if user has a specific action on this page.
 * Usage: const can = usePageCan(); can('view'), can('add'), can('edit'), can('delete')
 */
export function usePageCan() {
  const permissions = usePagePermissions();
  const slugs = useMemo(() => new Set(permissions.map((p) => p.slug)), [permissions]);
  return (action: string) => {
    // Match by slug suffix (e.g. 'users-view') or action code
    return [...slugs].some((s) => s.endsWith(`-${action}`));
  };
}
