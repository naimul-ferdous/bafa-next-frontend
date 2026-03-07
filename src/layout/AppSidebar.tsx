"use client";
import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { Menu } from "@/libs/types";

// Return icon name directly from database, or default icon
const getIconName = (iconName?: string | null): string => {
  return iconName || "hugeicons:menu-01";
};

// Build hierarchical menu structure from flat list
const buildMenuTree = (menus: Menu[]): Menu[] => {
  const menuMap = new Map<number, Menu>();
  const rootMenus: Menu[] = [];

  // First pass: create a map of all menus with children array
  menus.forEach((menu) => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });

  // Second pass: build the tree structure
  menus.forEach((menu) => {
    const menuItem = menuMap.get(menu.id)!;

    if (menu.parent_id === null || menu.parent_id === undefined) {
      // This is a root menu item
      rootMenus.push(menuItem);
    } else {
      // This is a child menu item
      const parent = menuMap.get(menu.parent_id);
      if (parent && parent.children) {
        parent.children.push(menuItem);
      }
    }
  });

  // Sort menus by order
  const sortMenus = (items: Menu[]): Menu[] => {
    return items
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        ...item,
        children:
          item.children && item.children.length > 0
            ? sortMenus(item.children)
            : [],
      }));
  };

  return sortMenus(rootMenus);
};

const normalizeRoute = (path: string) => path.replace(/\/+$/, "");

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user, menus } = useAuth();
  const pathname = usePathname();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const isActive = useCallback(
    (path: string) => {
      const normalized = normalizeRoute(path);
      const normalizedPathname = normalizeRoute(pathname);
      return normalizedPathname === normalized || normalizedPathname.startsWith(normalized + "/");
    },
    [pathname]
  );

  const toggleSubmenu = (menuId: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // Compute which menus should be auto-opened based on current pathname (synchronous, no flash)
  const autoOpenKeys = useMemo(() => {
    const result: Record<string, boolean> = {};
    const normalizedPathname = normalizeRoute(pathname);
    const matchesRoute = (route: string) => {
      const normalized = normalizeRoute(route);
      return normalizedPathname === normalized || normalizedPathname.startsWith(normalized + "/");
    };
    const traverse = (menu: Menu, ancestors: string[]): boolean => {
      const key = `menu-${menu.id}`;
      let active = !!(menu.route && matchesRoute(menu.route));
      if (menu.children && menu.children.length > 0) {
        const childActive = menu.children.some((child: Menu) => traverse(child, [...ancestors, key]));
        if (childActive) active = true;
      }
      if (active) {
        result[key] = true;
        ancestors.forEach((a) => { result[a] = true; });
      }
      return active;
    };
    menus.forEach((menu) => traverse(menu, []));
    return result;
  }, [menus, pathname]);

  // Recursive function to check if any child is active
  const hasActiveChild = useCallback((menu: Menu): boolean => {
    if (menu.route) {
      const normalized = normalizeRoute(menu.route);
      const normalizedPathname = normalizeRoute(pathname);
      if (normalizedPathname === normalized || normalizedPathname.startsWith(normalized + "/")) {
        return true;
      }
    }
    if (menu.children && menu.children.length > 0) {
      return menu.children.some((child: Menu) => hasActiveChild(child));
    }
    return false;
  }, [pathname]);

  const pendingWingIds = useMemo(() => {
    return user?.assign_wings?.filter((aw: any) => aw.status === "pending").map((aw: any) => aw.wing_id) || [];
  }, [user]);

  // Recursive menu item renderer
  const renderMenuItem = (menu: Menu, level: number = 0): React.ReactNode => {
    const hasChildren = menu.children && menu.children.length > 0;
    const menuPath = menu.route || "";
    const menuKey = `menu-${menu.id}`;
    const isOpen = openSubmenus[menuKey] ?? autoOpenKeys[menuKey] ?? false;
    const parentActive = hasChildren && !!menuPath ? hasActiveChild(menu) : false;

    const isPending = menu.wing_id ? pendingWingIds.includes(menu.wing_id) : false;

    if (isPending) {
      return (
        <li key={menu.id}>
           <div
            className={`menu-item group menu-item-inactive cursor-not-allowed opacity-50 ${
              level === 0 && !isExpanded && !isHovered
                ? "lg:justify-center"
                : "lg:justify-start"
            }`}
            style={{ paddingLeft: level > 0 ? `${level * 1.5}rem` : undefined }}
            title="Access pending approval"
          >
            <span className="menu-item-icon-inactive">
              <Icon icon={getIconName(menu.icon)} className="w-5 h-5" />
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text truncate">{menu.name}</span>
            )}
            {hasChildren && (isExpanded || isHovered || isMobileOpen) && (
              <Icon
                icon="hugeicons:arrow-down-01"
                className="ml-auto w-5 h-5 opacity-50"
              />
            )}
          </div>
        </li>
      );
    }

    return (
      <li key={menu.id}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleSubmenu(menuKey)}
              className={`menu-item group ${parentActive ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${
                level === 0 && !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
              style={{ paddingLeft: level > 0 ? `${level * 1.5}rem` : undefined }}
            >
              <span className={parentActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                <Icon icon={getIconName(menu.icon)} className="w-5 h-5" />
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text truncate">{menu.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <Icon
                  icon="hugeicons:arrow-down-01"
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              )}
            </button>
            {(isExpanded || isHovered || isMobileOpen) && isOpen && (
              <ul className="space-y-1">
                {menu.children!.map((subItem: Menu) => renderMenuItem(subItem, level + 1))}
              </ul>
            )}
          </>
        ) : menuPath ? (
          <Link
            href={menuPath}
            className={`menu-item group ${
              isActive(menuPath) ? "menu-item-active" : "menu-item-inactive"
            }`}
            style={{ paddingLeft: level > 0 ? `${level * 1.5}rem` : undefined }}
          >
            <span
              className={`${
                isActive(menuPath) ? "menu-item-icon-active" : "menu-item-icon-inactive"
              }`}
            >
              <Icon icon={getIconName(menu.icon)} className="w-5 h-5" />
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text truncate">{menu.name}</span>
            )}
          </Link>
        ) : (
          <div
            className={`menu-item group menu-item-inactive cursor-default opacity-60 ${
              level === 0 && !isExpanded && !isHovered
                ? "lg:justify-center"
                : "lg:justify-start"
            }`}
            style={{ paddingLeft: level > 0 ? `${level * 1.5}rem` : undefined }}
          >
            <span className="menu-item-icon-inactive">
              <Icon icon={getIconName(menu.icon)} className="w-5 h-5" />
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text truncate">{menu.name}</span>
            )}
          </div>
        )}
      </li>
    );
  };

  const renderMenuItems = (menuItems: Menu[]) => (
    <ul className="flex flex-col gap-4">
      {menuItems.map((menu) => renderMenuItem(menu, 0))}
    </ul>
  );

  const assignments = user?.role_assignments || user?.roleAssignments || [];
  const primaryAssignment = assignments.find((a: any) => a.is_primary) || assignments[0];
  
  // Try to get wingCode from role assignments first, fallback to assign_wings (Instructor Wings)
  let wingCode = primaryAssignment?.wing?.code;
  if (!wingCode && user?.assign_wings && user.assign_wings.length > 0) {
    wingCode = user.assign_wings[0].wing?.code;
  }

  const roleName = user?.role?.name || primaryAssignment?.role?.name || user?.roles?.[0]?.name || "Admin";

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-3">
              <Image
                className="dark:hidden"
                src="/images/logo/logo.png"
                alt="Logo"
                width={54}
                height={54}
              />
              <div>
                <p className="text-base font-medium text-black">
                  Bangladesh Air Force Academy {wingCode ? `(${wingCode})` : ""}
                </p>
                <p className="text-sm font-light text-gray-600">
                  {roleName} Panel
                </p>
              </div>
            </div>
          ) : (
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {menus && menus.length > 0 ? (
              renderMenuItems(menus)
            ) : (
              <div className="text-center text-gray-400 text-sm py-4">
                No menu items available
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
