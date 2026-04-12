"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";
import type { InstructorBiodata, CtwInstructorAssignModule } from "@/libs/types/user";
import FullLogo from "../ui/fulllogo";

interface InstructorViewAssignedModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
}

export default function InstructorViewAssignedModulesModal({
  isOpen,
  onClose,
  instructor,
}: InstructorViewAssignedModulesModalProps) {
  const assignedModules = instructor?.user?.ctw_assigned_modules?.filter(m => m.is_active) || [];

  // Group modules by course + semester
  const groupedBySemester = assignedModules.reduce<Record<string, { courseName: string; semesterName: string; modules: CtwInstructorAssignModule[] }>>((acc, am) => {
    const courseName = am.course?.name || am.course?.code || `Course ${am.course_id}`;
    const semesterName = am.semester?.name || am.semester?.code || `Semester ${am.semester_id}`;
    const key = `${am.course_id}-${am.semester_id}`;
    if (!acc[key]) acc[key] = { courseName, semesterName, modules: [] };
    acc[key].modules.push(am);
    return acc;
  }, {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-3xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assigned CTW Modules
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {instructor?.user?.name || "Instructor"} ({instructor?.user?.service_number || "N/A"})
          </p>
        </div>

        {assignedModules.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Icon icon="hugeicons:package" className="w-10 h-10 mx-auto mb-2" />
            <p>No CTW modules assigned</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(groupedBySemester).map(([key, group]) => (
              <div key={key}>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Icon icon="hugeicons:calendar-03" className="w-4 h-4 text-blue-500" />
                  {group.courseName} - {group.semesterName}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {group.modules.map((am) => (
                      <div
                        key={am.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <Icon icon="hugeicons:package" className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {am.module?.full_name || am.module?.code || "Unknown Module"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {am.course?.code || am.course?.name || ""}
                          </p>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
