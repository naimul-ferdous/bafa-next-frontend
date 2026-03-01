/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import MarksheetForm from "@/components/atw-subjects/MarksheetForm";

export default function CreateMarksheetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await atwMarksheetService.createMarksheet(data);
      router.push("/atw/subjects/modules/marksheets");
    } catch (error) {
      console.error("Failed to create marksheet:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <Icon icon="hugeicons:arrow-left-01" className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Create Subject Module Marksheet</h1>
      </div>

      <MarksheetForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
      />
    </div>
  );
}
