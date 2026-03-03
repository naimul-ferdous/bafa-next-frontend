/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwMedicalDisposalSyllabusService } from "@/libs/services/atwMedicalDisposalSyllabusService";
import type { AtwMedicalDisposalSyllabus } from "@/libs/types/atwMedicalDisposal";
import SyllabusForm, { type SyllabusFormData } from "@/components/atw-medical-disposal-syllabus/SyllabusForm";
import FullLogo from "@/components/ui/fulllogo";

export default function EditAtwMedicalDisposalSyllabusPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params?.id as string);

  const [syllabus, setSyllabus] = useState<AtwMedicalDisposalSyllabus | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || isNaN(id)) { setError("Invalid ID"); setLoadingData(false); return; }
    atwMedicalDisposalSyllabusService.getOne(id)
      .then((data) => setSyllabus(data))
      .catch(() => setError("Failed to load syllabus data"))
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleSubmit = async (data: SyllabusFormData) => {
    setLoading(true);
    try {
      await atwMedicalDisposalSyllabusService.update(id, data);
      router.push(`/atw/assessments/medical-disposal/syllabus/${id}`);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center py-24">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !syllabus) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-16">
        <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">{error || "Syllabus not found"}</p>
        <button onClick={() => router.push("/atw/assessments/medical-disposal/syllabus")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Edit Medical Disposal Syllabus</h2>
      </div>

      <SyllabusForm
        initialData={syllabus}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/atw/assessments/medical-disposal/syllabus/${id}`)}
        loading={loading}
        isEdit
      />
    </div>
  );
}
