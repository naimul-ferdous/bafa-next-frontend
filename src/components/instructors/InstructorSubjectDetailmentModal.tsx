"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import type { InstructorBiodata } from "@/libs/types/user";
import InstructorSubjectDetailment from "./InstructorSubjectDetailment";
import FullLogo from "../ui/fulllogo";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
}

export default function InstructorSubjectDetailmentModal({ isOpen, onClose, instructor }: Props) {
  if (!instructor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-4xl">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Subject Detailment</h2>
          <p className="text-sm text-gray-500">
            {instructor.user?.name || "Instructor"} ({instructor.user?.service_number || "N/A"})
          </p>
        </div>
        <InstructorSubjectDetailment
          userId={instructor.user_id}
          userName={instructor.user?.name}
        />
      </div>
    </Modal>
  );
}
