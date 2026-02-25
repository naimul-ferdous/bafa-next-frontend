"use client";

import React, { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Menu, Permission } from "@/libs/types/menu";

// ─── helpers ────────────────────────────────────────────────────────────────

const normalizeRoute = (path: string) => path.replace(/\/+$/, "");

function findMenuByRoute(menus: Menu[], pathname: string): Menu | null {
  const normalized = normalizeRoute(pathname);
  for (const menu of menus) {
    if (menu.route && normalizeRoute(menu.route) === normalized) return menu;
    if (menu.children?.length) {
      const found = findMenuByRoute(menu.children, pathname);
      if (found) return found;
    }
  }
  return null;
}

// ─── context type ───────────────────────────────────────────────────────────

interface PagePermissionsValue {
  menu: Menu | null;
  permissions: Permission[];
}

const PagePermissionsContext = createContext<PagePermissionsValue>({
  menu: null,
  permissions: [],
});

// ─── provider ───────────────────────────────────────────────────────────────

export function PagePermissionsProvider({ children }: { children: React.ReactNode }) {
  const { menus, user } = useAuth();
  const pathname = usePathname();

  const value = useMemo<PagePermissionsValue>(() => {
    const menu = findMenuByRoute(menus, pathname);
    const menuPermissions = menu?.permissions ?? [];

    if (menuPermissions.length === 0) return { menu, permissions: [] };

    // Build set of slugs the user actually holds (from all roles)
    const userSlugs = new Set<string>();
    (user?.roles ?? []).forEach((role: any) => {
      (role.permissions ?? []).forEach((p: any) => userSlugs.add(p.slug));
    });

    const permissions = menuPermissions.filter((p) => userSlugs.has(p.slug));
    return { menu, permissions };
  }, [menus, pathname, user]);

  return (
    <PagePermissionsContext.Provider value={value}>
      {children}
    </PagePermissionsContext.Provider>
  );
}

// ─── hooks ──────────────────────────────────────────────────────────────────

/** Returns the current page menu and the user's permissions for it. */
export function usePageContext(): PagePermissionsValue {
  return useContext(PagePermissionsContext);
}

/** Returns only the permissions array. */
export function usePermissions(): Permission[] {
  return useContext(PagePermissionsContext).permissions;
}

/**
 * Returns a checker: can('view') | can('add') | can('edit') | can('delete')
 * Matches against permission action code (preferred) or slug suffix.
 */
export function useCan() {
  const { permissions } = useContext(PagePermissionsContext);
  return useMemo(() => {
    return (action: string): boolean =>
      permissions.some(
        (p) =>
          p.action?.code === action ||
          p.slug.endsWith(`-${action}`)
      );
  }, [permissions]);
}
