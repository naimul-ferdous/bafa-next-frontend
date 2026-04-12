"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnCadetWarningService } from "@/libs/services/ftw12sqnCadetWarningService";
import Ftw12SqnCadetWarningForm from "@/components/ftw-12sqn-warnings/Ftw12SqnCadetWarningForm";

export default function CreateFtw12SqnCadetWarningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await ftw12sqnCadetWarningService.create(data);
      if (res) {
        router.push("/ftw12sqn/assessments/warnings/view");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw12sqn/assessments/warnings/view");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <Ftw12SqnCadetWarningForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
