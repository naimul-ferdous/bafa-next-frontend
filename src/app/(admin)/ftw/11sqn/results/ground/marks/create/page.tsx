/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import Ftw11sqnGroundExaminationMarkForm from "@/components/ftw-11sqn-ground-examination/Ftw11sqnGroundExaminationMarkForm";
import type { Ftw11sqnGroundExaminationMarkCreateData } from "@/libs/types/ftw11sqnExamination";

export default function CreateFtw11sqnGroundExaminationMarkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Ftw11sqnGroundExaminationMarkCreateData) => {
    setLoading(true);
    try {
      await ftw11sqnGroundExaminationMarkService.createMark(data);
      router.push("/ftw/11sqn/results/ground/marks");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/results/ground/marks");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create FTW 11SQN Ground Examination Mark</h2>
      </div>

      <Ftw11sqnGroundExaminationMarkForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
