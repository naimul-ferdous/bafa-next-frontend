/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "@/components/ui/fulllogo";
import SubjectForm from "@/components/atw-subjects/SubjectForm";

export default function CreateAtwSubjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await atwSubjectService.createSubject(data);
      router.push("/atw/subjects");
    } catch (error) {
      console.error("Failed to create ATW subject:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/subjects");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Map Subject to Course Context</h2>
      </div>

      <div className="mx-auto">
        <SubjectForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          isEdit={false}
        />
      </div>
    </div>
  );
}
