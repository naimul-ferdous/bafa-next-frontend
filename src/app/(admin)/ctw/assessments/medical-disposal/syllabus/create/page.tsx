"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctwMedicalDisposalSyllabusService } from "@/libs/services/ctwMedicalDisposalSyllabusService";
import SyllabusForm, { type SyllabusFormData } from "@/components/ctw-medical-disposal-syllabus/SyllabusForm";
import FullLogo from "@/components/ui/fulllogo";

export default function CreateCtwMedicalDisposalSyllabusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SyllabusFormData) => {
    setLoading(true);
    try {
      await ctwMedicalDisposalSyllabusService.create(data);
      router.push("/ctw/assessments/medical-disposal/syllabus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Create Medical Disposal Syllabus</h2>
      </div>

      <SyllabusForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ctw/assessments/medical-disposal/syllabus")}
        loading={loading}
      />
    </div>
  );
}
