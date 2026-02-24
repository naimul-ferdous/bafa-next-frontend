"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctwCadetWarningService } from "@/libs/services/ctwCadetWarningService";
import FullLogo from "@/components/ui/fulllogo";
import CtwCadetWarningForm from "@/components/ctw/warnings/CtwCadetWarningForm";

export default function CreateCtwCadetWarningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await ctwCadetWarningService.create(data);
      if (res) {
        router.push("/ctw/assessments/warnings");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/assessments/warnings");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest underline decoration-2 underline-offset-4">Add Cadet Warning (CTW)</h2>
      </div>

      <CtwCadetWarningForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
