"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnCadetWarningService } from "@/libs/services/ftw11sqnCadetWarningService";
import FullLogo from "@/components/ui/fulllogo";
import Ftw11sqnCadetWarningForm from "@/components/ftw-11sqn-assessment-warnings/Ftw11sqnCadetWarningForm";

export default function CreateFtw11sqnCadetWarningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await ftw11sqnCadetWarningService.create(data);
      if (res) {
        router.push("/ftw/11sqn/assessments/warnings");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/assessments/warnings");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest underline decoration-2 underline-offset-4">Add Cadet Warning (11SQN)</h2>
      </div>

      <Ftw11sqnCadetWarningForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
