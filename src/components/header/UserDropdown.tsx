"use client";
import Image from "next/image";
// import Link from "next/link";
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Modal } from "../ui/modal";
import { useAuth } from "@/libs/hooks/useAuth";
import { authService } from "@/libs/services/authService";
import { getImageUrl } from "@/libs/utils/formatter";
import FullLogo from "../ui/fulllogo";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [switchRoleModalOpen, setSwitchRoleModalOpen] = useState(false);
  const [confirmRoleModalOpen, setConfirmRoleModalOpen] = useState(false);
  const [selectedRoleToSwitch, setSelectedRoleToSwitch] = useState<any>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const { user, logout, loading, refreshUser } = useAuth();

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = () => {
    closeDropdown();
    setLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutModalOpen(false);
    await logout();
  };

  const handleSwitchRole = () => {
    closeDropdown();
    setSwitchRoleModalOpen(true);
  };

  const onRoleClick = (role: any) => {
    if (role.pivot?.is_primary) return; // Do nothing if it's already primary

    setSelectedRoleToSwitch(role);
    setSwitchRoleModalOpen(false);
    setConfirmRoleModalOpen(true);
  };

  const confirmSwitchRole = async () => {
    if (!selectedRoleToSwitch) return;

    try {
      setIsSwitching(true);
      const res = await authService.switchRole(selectedRoleToSwitch.id);

      if (res.success) {
        // Refresh the user data globally so the UI updates
        await refreshUser();
        setConfirmRoleModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
      // Fallback close just in case
      setConfirmRoleModalOpen(false);
    } finally {
      setIsSwitching(false);
    }
  };

  // Get user display information
  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userServiceNumber = user?.service_number || "";
  const userRank = user?.rank?.short_name || user?.rank?.name || "";
  const userRole = user?.role?.name || user?.roles?.find((r: any) => r.pivot?.is_primary)?.name || user?.roles?.[0]?.name || "";
  const userPhone = user?.phone || "";

  // Get extension matching primary role
  const primaryRoleId = user?.roles?.find((r: any) => r.pivot?.is_primary)?.id ?? (user?.role as any)?.id;
  const userExtension = (user as any)?.assigned_extensions?.find(
    (ae: any) => ae.extension?.role_id === primaryRoleId
  )?.extension?.name || null;

  // Get user initials for avatar
  const userInitials = userName
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Deduplicate roles by role ID (user may be assigned same role multiple times across contexts)
  const uniqueRoles: any[] = [];
  const seenRoleIds = new Set<number>();
  if (user?.roles) {
    for (const role of user.roles) {
      if (!seenRoleIds.has(role.id)) {
        seenRoleIds.add(role.id);
        uniqueRoles.push(role);
      }
    }
  }

  const hasMultipleRoles = uniqueRoles.length > 1;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-brand-50 dark:bg-gray-800 flex items-center justify-center">
          {user?.profile_photo ? (
            <Image
              src={user.profile_photo}
              alt={userName}
              width={44}
              height={44}
              className="rounded-full object-cover object-center w-full h-full"
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
            {userRole}{userExtension ? ` · ${userExtension}` : ""}
          </span>
        </div>

        <Icon
          icon="hugeicons:arrow-down-01"
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
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
                src={user.profile_photo}
                alt={userName}
                width={48}
                height={48}
                className="rounded-full object-cover object-center w-full h-full"
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
            {/* {userEmail && (
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {userEmail}
              </span>
            )} */}
            {userServiceNumber && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">
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
              {uniqueRoles.length > 0 ? (
                uniqueRoles.map((role: any) => (
                  <span key={role.id} className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${role.pivot?.is_primary ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300 shadow-sm dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-400 dark:border-yellow-700/50' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'}`}>
                    <Icon icon={role.pivot?.is_primary ? "hugeicons:user-status" : "hugeicons:user-settings-01"} className="w-3 h-3 mr-1" />
                    {role.name}
                  </span>
                ))
              ) : userRole ? (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                  <Icon icon="hugeicons:user-settings-01" className="w-3 h-3 mr-1" />
                  {userRole}
                </span>
              ) : null}
              {userExtension && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-700/50">
                  <Icon icon="hugeicons:puzzle" className="w-3 h-3 mr-1" />
                  {userExtension}
                </span>
              )}
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-1 py-3 border-b border-gray-200 dark:border-gray-800">
           {hasMultipleRoles && (
            <li>
              <DropdownItem
                onItemClick={handleSwitchRole}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-sm hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
              >
                <Icon
                  icon="hugeicons:user-switch"
                  className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                />
                Switch Role
              </DropdownItem>
            </li>
          )}
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
          <Icon icon="hugeicons:logout-03" className="w-5 h-5" />
          {loading ? "Signing out..." : "Sign out"}
        </button>
      </Dropdown>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        className="max-w-sm mx-4 p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-4">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4"><FullLogo /></div>
            <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
              Confirm Logout
            </h2>
            <p className="text-sm text-gray-500">You will be logged out of your account.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing out..." : "Yes, Logout"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Switch Role Selection Modal */}
      <Modal
        isOpen={switchRoleModalOpen}
        onClose={() => setSwitchRoleModalOpen(false)}
        className="max-w-md mx-4 p-6"
      >
        <div className="flex flex-col gap-4">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4"><FullLogo /></div>
            <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
            <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Switch Role</h2>
            <p className="text-sm text-gray-500 mt-2">Select a role to switch your primary context.</p>
          </div>

          <div className="flex flex-col gap-2 mt-2 max-h-[60vh] overflow-y-auto">
            {uniqueRoles.map((role: any) => {
              const isPrimary = role.pivot?.is_primary;
              const isRoleSwitchable = role.is_role_switch !== false && role.is_role_switch !== 0;
              const isDisabled = isPrimary || !isRoleSwitchable;

              return (
                <button
                  key={role.id}
                  onClick={() => !isDisabled && onRoleClick(role)}
                  disabled={isDisabled}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${isPrimary
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700/50 cursor-default'
                    : !isRoleSwitchable
                      ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500/50 dark:hover:bg-brand-900/20 cursor-pointer'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPrimary ? 'bg-yellow-200 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                      <Icon icon={isPrimary ? "hugeicons:user-status" : !isRoleSwitchable ? "hugeicons:lock-key" : "hugeicons:user-settings-01"} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{role.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isPrimary 
                          ? 'Current Primary Role' 
                          : !isRoleSwitchable 
                            ? 'Cannot switch to this role' 
                            : 'Switch to this role'}
                      </div>
                    </div>
                  </div>
                  {isPrimary ? (
                    <Icon icon="hugeicons:tick-circle" className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                  ) : null}
                  
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setSwitchRoleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Switch Role Confirmation Modal */}
      <Modal
        isOpen={confirmRoleModalOpen}
        onClose={() => !isSwitching && setConfirmRoleModalOpen(false)}
        className="max-w-md mx-4 p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <div className="flex justify-center mb-4"><FullLogo /></div>
            <h1 className="text-xl font-bold text-gray-900 uppercase dark:text-white">Bangladesh Air Force Academy</h1>
            <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase dark:text-gray-300">
              Confirm Role Switch
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Do you want to switch your active role to <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedRoleToSwitch?.name}</span>? This will reload your dashboard and menus.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={() => {
                setConfirmRoleModalOpen(false);
                setSwitchRoleModalOpen(true); // go back to list
              }}
              disabled={isSwitching}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmSwitchRole}
              disabled={isSwitching}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSwitching ? (
                <>
                  <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />
                  Switching...
                </>
              ) : (
                "Yes, Switch"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
