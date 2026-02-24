"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { atwCadetWarningService } from "@/libs/services/atwCadetWarningService";
import FullLogo from "@/components/ui/fulllogo";
import AtwCadetWarningForm from "@/components/atw/warnings/AtwCadetWarningForm";

export default function CreateAtwCadetWarningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await atwCadetWarningService.create(data);
      if (res) {
        router.push("/atw/assessments/warnings");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/warnings");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Add Cadet Warning</h2>
      </div>

      <AtwCadetWarningForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
