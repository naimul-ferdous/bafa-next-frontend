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
  allMenus: Menu[];
  userSlugs: Set<string>;
}

const PagePermissionsContext = createContext<PagePermissionsValue>({
  menu: null,
  permissions: [],
  allMenus: [],
  userSlugs: new Set(),
});

// ─── provider ───────────────────────────────────────────────────────────────

export function PagePermissionsProvider({ children }: { children: React.ReactNode }) {
  const { menus, user } = useAuth();
  const pathname = usePathname();

  const value = useMemo<PagePermissionsValue>(() => {
    const menu = findMenuByRoute(menus, pathname);
    const menuPermissions = menu?.permissions ?? [];

    // Build set of slugs the user actually holds (from all roles)
    // Note: backend already filters roles to only primary + merged roles
    const userSlugs = new Set<string>();
    (user?.roles ?? []).forEach((role: any) => {
      (role.permissions ?? []).forEach((p: any) => userSlugs.add(p.slug));
    });

    if (menuPermissions.length === 0) return { menu, permissions: [], allMenus: menus, userSlugs };

    const permissions = menuPermissions.filter((p) => userSlugs.has(p.slug));
    return { menu, permissions, allMenus: menus, userSlugs };
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
 * Pass an optional URL to check permissions for a different route instead of
 * the current page. e.g. useCan("/atw/results")
 */
export function useCan(url?: string) {
  const { permissions, allMenus, userSlugs } = useContext(PagePermissionsContext);

  return useMemo(() => {
    let resolved = permissions;

    if (url) {
      const targetMenu = findMenuByRoute(allMenus, url);
      const menuPermissions = targetMenu?.permissions ?? [];
      resolved = menuPermissions.length === 0
        ? []
        : menuPermissions.filter((p) => userSlugs.has(p.slug));
    }

    return (action: string): boolean =>
      resolved.some(
        (p) =>
          p.action?.code === action ||
          p.slug.endsWith(`-${action}`)
      );
  }, [permissions, url, allMenus, userSlugs]);
}
