/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "../ui/fulllogo";
import { Modal } from "@/components/ui/modal";
import { userService } from "@/libs/services/userService";
import { roleService } from "@/libs/services/roleService";
import { wingService } from "@/libs/services/wingService";
import { subWingService } from "@/libs/services/subWingService";
import { commonService } from "@/libs/services/commonService";
import { atwUserAssignService } from "@/libs/services/atwUserAssignService";
import { useAuth } from "@/libs/hooks/useAuth";
import type { InstructorBiodata, Role, Wing, SubWing } from "@/libs/types/user";
import type { SystemCourse } from "@/libs/types/system";
import {
  AtwPenpictureAssign,
  AtwCounselingAssign,
  AtwOlqAssign,
  AtwWarningAssign,
} from "@/libs/types/atwAssign";

interface InstructorAssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
  onSuccess?: () => void;
}

type AssessmentType = "penpicture" | "counseling" | "olq" | "warning";

const ASSESSMENTS: { key: AssessmentType; label: string; color: string }[] = [
  { key: "penpicture", label: "Pen Picture", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "counseling", label: "Counseling", color: "bg-blue-100   text-blue-700   border-blue-200" },
  { key: "olq", label: "OLQ", color: "bg-green-100  text-green-700  border-green-200" },
  { key: "warning", label: "Warning", color: "bg-red-100    text-red-700    border-red-200" },
];

interface ExistingAssigns {
  penpicture: AtwPenpictureAssign | null;
  counseling: AtwCounselingAssign | null;
  olq: AtwOlqAssign | null;
  warning: AtwWarningAssign | null;
}

export default function InstructorAssignRoleModal({
  isOpen,
  onClose,
  instructor,
  onSuccess,
}: InstructorAssignRoleModalProps) {
  const { user: currentUser, userIsSuperAdmin } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [subWings, setSubWings] = useState<SubWing[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [selectedMergeRoleId, setSelectedMergeRoleId] = useState<number | "">("");
  const [selectedWingId, setSelectedWingId] = useState<number | "" | null>("");
  const [selectedSubWingId, setSelectedSubWingId] = useState<number | "" | null>("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Assessment related state
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [checks, setChecks] = useState<Record<AssessmentType, boolean>>({
    penpicture: false,
    counseling: false,
    olq: false,
    warning: false,
  });
  const [existing, setExisting] = useState<ExistingAssigns>({
    penpicture: null,
    counseling: null,
    olq: null,
    warning: null,
  });
  const [loadingAssigns, setLoadingAssigns] = useState(false);

  const user = instructor?.user;

  // Check if user already has instructor role
  const userHasInstructorRole = useMemo(() => {
    const assignments = user?.role_assignments || user?.roleAssignments || [];
    return assignments.some((a: any) => {
      const name = a.role?.name?.toLowerCase() || "";
      const slug = a.role?.slug?.toLowerCase() || "";
      return name === "instructor" || slug === "instructor";
    });
  }, [user]);

  // Already assigned role IDs
  const assignedRoleIds = useMemo(() => {
    const assignments = user?.role_assignments || user?.roleAssignments || [];
    return new Set(assignments.map((a: any) => a.role_id));
  }, [user]);

  // Get admin authorization sets once
  const authContext = useMemo(() => {
    const authorizedWingIds = new Set<number>();
    const authorizedSubWingIds = new Set<number>();

    if (!currentUser) return { authorizedWingIds, authorizedSubWingIds };

    // From primary role
    if (currentUser.role?.wing_id) authorizedWingIds.add(Number(currentUser.role.wing_id));
    if ((currentUser.role as any)?.subwing_id)
      authorizedSubWingIds.add(Number((currentUser.role as any).subwing_id));

    // From all assigned roles
    const assignments = currentUser.role_assignments || currentUser.roleAssignments || [];
    assignments.forEach((a: any) => {
      const wId = a.wing_id || a.wing?.id;
      if (wId) authorizedWingIds.add(Number(wId));

      const swId = a.sub_wing_id || a.subwing_id || a.sub_wing?.id || a.subwing?.id;
      if (swId) authorizedSubWingIds.add(Number(swId));
    });

    return { authorizedWingIds, authorizedSubWingIds };
  }, [currentUser]);

  // ─── filteredRoles: only switchable roles (is_role_switch truthy) ───────────
  const filteredRoles = useMemo(() => {
    if (!roles.length) return [];

    // Super admins see all switchable roles
    if (userIsSuperAdmin) return roles.filter((r) => !!r.is_role_switch);

    const { authorizedWingIds } = authContext;

    return roles.filter((role) => {
      // 1. Only show switchable roles (handles both boolean true and integer 1)
      if (!role.is_role_switch) return false;

      // 2. Instructor role is always available
      if (role.slug === "instructor" || role.name?.toLowerCase() === "instructor") return true;

      const roleWingId =
        role.wing_id !== null && role.wing_id !== undefined ? Number(role.wing_id) : null;
      const roleSubWingId =
        role.subwing_id !== null && role.subwing_id !== undefined
          ? Number(role.subwing_id)
          : null;

      // 3. Admin Authorization Filter (Pool Access)
      const isGlobal = roleWingId === null;
      const hasWingAccess = roleWingId !== null && authorizedWingIds.has(roleWingId);
      if (!isGlobal && !hasWingAccess) return false;

      // 4. Form-Based Refinement Filter
      if (selectedWingId) {
        const targetWingId = Number(selectedWingId);
        if (roleWingId !== null && roleWingId !== targetWingId) return false;

        if (selectedSubWingId) {
          const targetSubWingId = Number(selectedSubWingId);
          if (roleSubWingId !== null && roleSubWingId !== targetSubWingId) return false;
        }
      }

      return true;
    });
  }, [roles, userIsSuperAdmin, authContext, selectedWingId, selectedSubWingId]);

  // ─── mergeRolesList: only non-switchable roles (is_role_switch falsy) ───────
  const mergeRolesList = useMemo(() => {
    if (!roles.length) return [];

    const { authorizedWingIds } = authContext;

    return roles.filter((role) => {
      // 1. Only show NON-switchable roles (handles both boolean false and integer 0)
      if (role.is_role_switch) return false;

      // Super admins see all non-switchable roles
      if (userIsSuperAdmin) return true;

      const roleWingId =
        role.wing_id !== null && role.wing_id !== undefined ? Number(role.wing_id) : null;
      const roleSubWingId =
        role.subwing_id !== null && role.subwing_id !== undefined
          ? Number(role.subwing_id)
          : null;

      // 2. Admin Authorization Filter
      const isGlobal = roleWingId === null;
      const hasWingAccess = roleWingId !== null && authorizedWingIds.has(roleWingId);
      if (!isGlobal && !hasWingAccess) return false;

      // 3. Form-Based Refinement Filter
      if (selectedWingId) {
        const targetWingId = Number(selectedWingId);
        if (roleWingId !== null && roleWingId !== targetWingId) return false;

        if (selectedSubWingId) {
          const targetSubWingId = Number(selectedSubWingId);
          if (roleSubWingId !== null && roleSubWingId !== targetSubWingId) return false;
        }
      }

      return true;
    });
  }, [roles, userIsSuperAdmin, authContext, selectedWingId, selectedSubWingId]);

  // ─── Fix: use !! so both boolean true and integer 1 are treated as truthy ───
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === Number(selectedRoleId)),
    [roles, selectedRoleId]
  );
  // This controls the toggle in the "Add" section
  const isSelectedRoleMargeable = useMemo(() => {
    if (!selectedRole) return false;
    return selectedRole.is_marge_role === true || 
           selectedRole.slug === "instructor" || 
           selectedRole.name?.toLowerCase() === "instructor";
  }, [selectedRole]);

  // ─── Filtered Wings and SubWings based on Admin Authorization ───────────
  const filteredWings = useMemo(() => {
    if (userIsSuperAdmin) return wings;
    const { authorizedWingIds } = authContext;
    return wings.filter((w) => authorizedWingIds.has(Number(w.id)));
  }, [wings, userIsSuperAdmin, authContext]);

  const filteredSubWings = useMemo(() => {
    if (userIsSuperAdmin) return subWings;
    const { authorizedSubWingIds } = authContext;
    // If admin has no subwing restrictions, show all subwings for the selected wing
    if (authorizedSubWingIds.size === 0) return subWings;
    return subWings.filter((sw) => authorizedSubWingIds.has(Number(sw.id)));
  }, [subWings, userIsSuperAdmin, authContext]);

  // ─── Auto-select Wing/SubWing based on Authorization or Role ─────────────
  useEffect(() => {
    if (!isOpen) return;

    // 1. If role has a fixed wing, use it
    if (selectedRole?.wing_id) {
      setSelectedWingId(Number(selectedRole.wing_id));
      if (selectedRole.subwing_id) {
        setSelectedSubWingId(Number(selectedRole.subwing_id));
      }
    }
    // 2. Otherwise, if Admin is restricted to one wing, auto-select it for generic roles (like Instructor)
    else if (!userIsSuperAdmin && filteredWings.length === 1 && !selectedWingId) {
      setSelectedWingId(Number(filteredWings[0].id));
    }
  }, [isOpen, selectedRole, filteredWings, userIsSuperAdmin, selectedWingId]);

  // Auto-select subwing if only one available
  useEffect(() => {
    if (isOpen && !userIsSuperAdmin && filteredSubWings.length === 1 && !selectedSubWingId && selectedWingId) {
      setSelectedSubWingId(Number(filteredSubWings[0].id));
    }
  }, [isOpen, filteredSubWings, selectedSubWingId, userIsSuperAdmin, selectedWingId]);

  const needsAssessment = isMergeMode;

  // Load initial data
  useEffect(() => {
    if (isOpen && instructor) {
      loadInitialData();
    }
  }, [isOpen, instructor]);

  // Load subwings when wing changes
  useEffect(() => {
    if (selectedWingId) {
      loadSubWings(Number(selectedWingId));
    } else {
      setSubWings([]);
      setSelectedSubWingId("");
    }
  }, [selectedWingId]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [rolesRes, wingsRes, options] = await Promise.all([
        roleService.getAllRoles({ per_page: 1000 }),
        wingService.getAllWings({ per_page: 100 }),
        commonService.getResultOptions(),
      ]);
      // Fix: use !!r.is_active so integer 1 is treated as active
      setRoles(rolesRes.data.filter((r) => !!r.is_active));
      setWings(wingsRes.data);
      if (options && options.courses) {
        setCourses(options.courses);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError("Failed to load roles and wings");
    } finally {
      setLoadingData(false);
    }
  };

  const loadSubWings = async (wingId: number) => {
    try {
      const result = await subWingService.getSubWingsByWing(wingId);
      setSubWings(result);
    } catch (err) {
      console.error("Failed to load sub-wings:", err);
      setSubWings([]);
    }
  };

  useEffect(() => {
    if (!selectedCourseId || !needsAssessment || !user) return;

    const fetchAssigns = async () => {
      setLoadingAssigns(true);
      setError(null);
      try {
        const data = await atwUserAssignService.getAll({
          course_id: parseInt(selectedCourseId),
        });

        const pp = data.penpicture[0] || null;
        const cn = data.counseling[0] || null;
        const olq = data.olq[0] || null;
        const wrn = data.warning[0] || null;

        setExisting({ penpicture: pp, counseling: cn, olq, warning: wrn });
        // Pre-check only if the CURRENT user already has the assignment
        setChecks({
          penpicture: !!pp && pp.user_id === user.id,
          counseling: !!cn && cn.user_id === user.id,
          olq: !!olq && olq.user_id === user.id,
          warning: !!wrn && wrn.user_id === user.id,
        });
      } catch {
        setError("Failed to load existing assignments.");
      } finally {
        setLoadingAssigns(false);
      }
    };

    fetchAssigns();
  }, [selectedCourseId, needsAssessment, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!selectedRoleId && !isMergeMode)) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Assign Primary/Main Role (Only if a new role is selected)
      if (selectedRoleId) {
        await userService.assignRole(user.id, {
          role_id: Number(selectedRoleId),
          wing_id: selectedWingId ? Number(selectedWingId) : null,
          sub_wing_id: selectedSubWingId ? Number(selectedSubWingId) : null,
          is_primary: isPrimary,
        });
      }

      // 2. Assign Merge Role if selected
      if (isMergeMode && selectedMergeRoleId) {
        await userService.assignRole(user.id, {
          role_id: Number(selectedMergeRoleId),
          wing_id: selectedWingId ? Number(selectedWingId) : null,
          sub_wing_id: selectedSubWingId ? Number(selectedSubWingId) : null,
          is_primary: false,
        });
      }

      // 3. Handle assessments if required
      if (isMergeMode && selectedCourseId) {
        const courseId = parseInt(selectedCourseId);
        const payload = { course_id: courseId, user_id: user.id, is_active: true };
        const ops: Promise<unknown>[] = [];

        (["penpicture", "counseling", "olq", "warning"] as AssessmentType[]).forEach((key) => {
          if (checks[key] && !existing[key]) {
            ops.push(atwUserAssignService.store(key, payload));
          }
        });

        if (ops.length > 0) await Promise.all(ops);
      }

      // Reset form
      setSelectedRoleId("");
      setSelectedMergeRoleId("");
      setSelectedWingId("");
      setSelectedSubWingId("");
      setIsPrimary(false);
      setSelectedCourseId("");
      setIsMergeMode(false);
      setChecks({ penpicture: false, counseling: false, olq: false, warning: false });

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!user || !confirm("Are you sure you want to remove this role assignment?")) return;

    try {
      await userService.removeRole(user.id, assignmentId);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to remove role:", err);
      setError("Failed to remove assignment");
    }
  };

  const handleClose = () => {
    setSelectedRoleId("");
    setSelectedMergeRoleId("");
    setSelectedWingId("");
    setSelectedSubWingId("");
    setIsPrimary(false);
    setSelectedCourseId("");
    setIsMergeMode(false);
    setChecks({ penpicture: false, counseling: false, olq: false, warning: false });
    setError(null);
    onClose();
  };

  // Reusable merge configuration fields
  const MergeConfigurationFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-blue-200 pl-4 py-2 bg-blue-50/30 rounded-r-lg">
      <div>
        <label className="block text-sm font-medium mb-1">
          Assign CIC/CT (Optional)
        </label>
        <select
          value={selectedMergeRoleId}
          onChange={(e) =>
            setSelectedMergeRoleId(e.target.value ? Number(e.target.value) : "")
          }
          className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-blue-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Role</option>
          {mergeRolesList.map((role) => (
            <option key={role.id} value={role.id} disabled={assignedRoleIds.has(role.id)}>
              {role.name} {assignedRoleIds.has(role.id) ? "(Assigned)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">
          Select Course (Optional)
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
          disabled={loadingAssigns || loading}
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {selectedCourseId && (
        <div className="col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 uppercase">
            Select Assessments (Optional)
          </label>
          {loadingAssigns ? (
            <div className="flex items-center justify-start py-6">
              <Icon
                icon="hugeicons:fan-01"
                className="w-6 h-6 animate-spin text-blue-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {ASSESSMENTS.map(({ key, label, color }) => {
                const isExisting = !!existing[key];
                const isDisabled = !selectedCourseId || isExisting;
                const assignedToCurrentUser =
                  isExisting && existing[key]?.user_id === user?.id;
                const assignedUserName =
                  isExisting && !assignedToCurrentUser
                    ? existing[key]?.user?.name
                    : null;

                return (
                  <label
                    key={key}
                    className={`flex flex-col gap-1 p-3 rounded-lg border transition-colors ${checks[key]
                      ? color
                      : isExisting
                        ? "bg-gray-100 border-gray-300 text-gray-500"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-200"
                      } ${isDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checks[key]}
                        disabled={isDisabled}
                        onChange={(e) =>
                          setChecks((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium flex-1">{label}</span>
                      {isExisting && (
                        <Icon
                          icon="hugeicons:checkmark-circle-02"
                          className="w-3.5 h-3.5 opacity-60"
                        />
                      )}
                    </div>
                    {assignedUserName && (
                      <span className="text-[10px] text-gray-400 pl-6 leading-tight">
                        {assignedUserName}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-3xl">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
            Instructor Role Assignments
          </h2>
          <p className="text-sm text-gray-500">
            Manage roles and wing access for {user?.name || "Instructor"} ({user?.service_number || "N/A"})
          </p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Existing Assignments */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Role</h4>
              {user?.role_assignments && user.role_assignments.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {user.role_assignments.map((assignment) => {
                    const roleName = assignment.role?.name?.toLowerCase() || "";
                    const roleSlug = assignment.role?.slug?.toLowerCase() || "";
                    const isMargeableRole = roleName === "instructor" || roleSlug === "instructor" || !!assignment.role?.is_marge_role;

                    return (
                      <div key={assignment.id} className="space-y-2">
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${assignment.is_active ? "bg-green-500" : "bg-gray-300"
                                }`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900">
                                  {assignment.role?.name || "Unknown Role"}
                                </p>
                                {assignment.is_primary && (
                                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-blue-100 text-blue-700">
                                    Primary
                                  </span>
                                )}
                              </div>
                              {(assignment.wing || assignment.sub_wing) && (
                                <p className="text-xs text-gray-500">
                                  {assignment.wing?.name}
                                  {assignment.sub_wing && ` / ${assignment.sub_wing.name}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove Assignment"
                          >
                            <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Merge Toggle for existing Instructor */}
                        {isMargeableRole && (
                          <div className="ml-8">
                            <div className="flex items-center gap-2 py-1">
                              <input
                                type="checkbox"
                                id={`merge-toggle-${assignment.id}`}
                                checked={isMergeMode}
                                onChange={(e) => setIsMergeMode(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`merge-toggle-${assignment.id}`}
                                className="text-sm font-bold text-blue-700 cursor-pointer"
                              >
                                Do you want to assign the role of CIC/Course Tutor?
                              </label>
                            </div>
                            {isMergeMode && <div className="mt-2"><MergeConfigurationFields /></div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  No roles currently assigned
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Role</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Role {isMergeMode ? "(Optional)" : <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => {
                      setSelectedRoleId(e.target.value ? Number(e.target.value) : "");
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!isMergeMode}
                  >
                    <option value="">Select Role</option>
                    {filteredRoles.map((role) => (
                      <option key={role.id} value={role.id} disabled={assignedRoleIds.has(role.id)}>
                        {role.name} {role.is_super_admin ? "(Super Admin)" : ""} {assignedRoleIds.has(role.id) ? "(Assigned)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Merge Mode Toggle for NEW selection */}
                {isSelectedRoleMargeable && (
                  <div className="flex items-center gap-2 md:col-span-2 py-2">
                    <input
                      type="checkbox"
                      id="isMergeModeNew"
                      checked={isMergeMode}
                      onChange={(e) => setIsMergeMode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="isMergeModeNew"
                      className="text-sm font-bold text-blue-700 cursor-pointer"
                    >
                      Do you want to assign this role as a CIC/Course Tutor?
                    </label>
                  </div>
                )}

                {/* Merge Role Selection (Conditional) for NEW selection */}
                {/* (Only show here if user is NOT already an instructor, to avoid double forms) */}
                {isMergeMode && !userHasInstructorRole && <div className="md:col-span-2"><MergeConfigurationFields /></div>}

                {/* Wing Selection */}
                {(userIsSuperAdmin || !currentUser?.role?.wing_id) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wing Access
                    </label>
                    <select
                      value={selectedWingId || ""}
                      onChange={(e) =>
                        setSelectedWingId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Wing Assignment</option>
                      {wings.map((wing) => (
                        <option key={wing.id} value={wing.id}>
                          {wing.name} ({wing.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* SubWing Selection */}
                {(userIsSuperAdmin || !(currentUser?.role as any)?.subwing_id) && !selectedRole?.subwing_id && selectedWingId && subWings.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub-Wing Access
                    </label>
                    <select
                      value={selectedSubWingId || ""}
                      onChange={(e) =>
                        setSelectedSubWingId(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Sub-Wing Assignment</option>
                      {filteredSubWings.map((subWing) => (
                        <option key={subWing.id} value={subWing.id}>
                          {subWing.name} ({subWing.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Is Primary */}
              <div className="flex items-center gap-2 mb-6">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="isPrimary"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Set as Primary Assignment
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading || (!selectedRoleId && !isMergeMode)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                      {selectedRoleId ? "Add Assignment" : "Update Assessments"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
