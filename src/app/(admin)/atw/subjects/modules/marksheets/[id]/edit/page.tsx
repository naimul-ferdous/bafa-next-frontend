/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import MarksheetForm from "@/components/atw-subjects/MarksheetForm";
import type { AtwSubjectsModuleMarksheet } from "@/libs/types/system";

export default function EditMarksheetPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [marksheet, setMarksheet] = useState<AtwSubjectsModuleMarksheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await atwMarksheetService.getMarksheet(parseInt(id));
      if (data) setMarksheet(data);
      else router.push("/atw/subjects/modules/marksheets");
    } catch (error) {
      console.error("Failed to load marksheet:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      await atwMarksheetService.updateMarksheet(parseInt(id), data);
      router.push("/atw/subjects/modules/marksheets");
    } catch (error) {
      console.error("Failed to update marksheet:", error);
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
        <h1 className="text-xl font-bold text-gray-900">Edit Marksheet: {marksheet?.name}</h1>
      </div>

      <MarksheetForm
        initialData={marksheet}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={submitting}
        isEdit={true}
      />
    </div>
  );
}
