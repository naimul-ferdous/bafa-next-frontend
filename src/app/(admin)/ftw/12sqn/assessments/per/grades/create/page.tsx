"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnAssessmentPenpictureGradeService } from "@/libs/services/ftw12sqnAssessmentPenpictureGradeService";
import FullLogo from "@/components/ui/fulllogo";
import GradeForm, { GradeFormData } from "@/components/ftw-12sqn-assessment-penpicture-grades/GradeForm";

export default function CreateGradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: GradeFormData) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        course_id: Number(data.course_id),
      };
      await ftw12sqnAssessmentPenpictureGradeService.createGrade(submitData);
      router.push("/ftw12sqn/assessments/penpicture/grades");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw12sqn/assessments/penpicture/grades");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Assessment Grade</h2>
      </div>

      <GradeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
