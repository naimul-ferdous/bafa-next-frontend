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
        router.push("/atw/assessments/warnings/view");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/warnings/view");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <AtwCadetWarningForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
