"use client";
import Image from "next/image";
// import Link from "next/link";
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "@/libs/hooks/useAuth";
import { getImageUrl } from "@/libs/utils/formatter";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = async () => {
    closeDropdown();
    await logout();
  };

  // Get user display information
  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userServiceNumber = user?.service_number || "";
  const userRank = user?.rank?.short_name || user?.rank?.name || "";
  const userRole = user?.roles?.[0]?.name || "";
  const userPhone = user?.phone || "";

  // Get user initials for avatar
  const userInitials = userName
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-brand-50 dark:bg-gray-800 flex items-center justify-center">
          {user?.profile_photo ? (
            <Image
              src={getImageUrl(user.profile_photo)}
              alt={userName}
              width={44}
              height={44}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-brand-600 dark:text-brand-400">
              {userInitials}
            </span>
          )}
        </span>

        <div className="text-end">
          <span className="hidden sm:block mr-1 font-medium text-md">
          {userName}
        </span>
        <span className="hidden sm:block mr-1 text-xs">
          {userRole}
        </span>
        </div>

        <Icon
          icon="hugeicons:arrow-down-01"
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[280px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
          <span className="overflow-hidden rounded-full h-12 w-12 bg-brand-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            {user?.profile_photo ? (
              <Image
                src={getImageUrl(user.profile_photo)}
                alt={userName}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-brand-600 dark:text-brand-400">
                {userInitials}
              </span>
            )}
          </span>
          <div className="flex-1 min-w-0">
            <span className="block font-semibold text-gray-900 text-base dark:text-gray-100 truncate">
              {userName}
            </span>
            {userServiceNumber && (
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {userServiceNumber}
              </span>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {userRank && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  <Icon icon="hugeicons:police-badge" className="w-3 h-3 mr-1" />
                  {userRank}
                </span>
              )}
              {userRole && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                  <Icon icon="hugeicons:user-settings-01" className="w-3 h-3 mr-1" />
                  {userRole}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="py-3 border-b border-gray-200 dark:border-gray-800 space-y-1">
          {userEmail && (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Icon
                icon="hugeicons:mail-01"
                className="w-4 h-4 text-gray-400 flex-shrink-0"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {userEmail}
              </span>
            </div>
          )}
          {userPhone && (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Icon
                icon="hugeicons:call"
                className="w-4 h-4 text-gray-400 flex-shrink-0"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {userPhone}
              </span>
            </div>
          )}
        </div>

        <ul className="flex flex-col gap-1 py-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Icon
                icon="hugeicons:user-circle"
                className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
              />
              My Profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Icon
                icon="hugeicons:settings-01"
                className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
              />
              Settings
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-red-600 rounded-lg group text-sm hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon
            icon="hugeicons:logout-03"
            className="w-5 h-5"
          />
          {loading ? "Signing out..." : "Sign out"}
        </button>
      </Dropdown>
    </div>
  );
}
