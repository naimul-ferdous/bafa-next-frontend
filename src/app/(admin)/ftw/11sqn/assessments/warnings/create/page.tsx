"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnCadetWarningService } from "@/libs/services/ftw11sqnCadetWarningService";
import Ftw11SqnCadetWarningForm from "@/components/ftw-11sqn-warnings/Ftw11SqnCadetWarningForm";

export default function CreateFtw11SqnCadetWarningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await ftw11sqnCadetWarningService.create(data);
      if (res) {
        router.push("/ftw11sqn/assessments/warnings/view");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw11sqn/assessments/warnings/view");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <Ftw11SqnCadetWarningForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
