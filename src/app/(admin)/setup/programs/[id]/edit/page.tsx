/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { programService } from "@/libs/services/programService";
import ProgramForm from "@/components/programs/ProgramForm";
import type { SystemProgram } from "@/libs/types/system";

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [program, setProgram] = useState<SystemProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await programService.getProgram(parseInt(id));
      if (data) setProgram(data);
      else router.push("/setup/programs");
    } catch (error) {
      console.error("Failed to load program:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { if (id) loadData(); }, [id, loadData]);

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await programService.updateProgram(parseInt(id), data);
      router.push("/setup/programs");
    } catch (error) {
      console.error("Failed to update program:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 flex justify-center"><Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <Icon icon="hugeicons:arrow-left-01" className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Edit Program: {program?.name}</h1>
      </div>

      <ProgramForm
        initialData={program}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        isEdit={true}
      />
    </div>
  );
}
