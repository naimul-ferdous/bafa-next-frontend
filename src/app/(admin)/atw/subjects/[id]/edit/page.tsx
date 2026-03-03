/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "@/components/ui/fulllogo";
import SubjectForm from "@/components/atw-subjects/SubjectForm";
import { AtwSubject } from "@/libs/types/system";
import { Icon } from "@iconify/react";

export default function EditAtwSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  const [subject, setSubject] = useState<AtwSubject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubject = async () => {
      try {
        setLoading(true);
        const parsedId = parseInt(subjectId);
        if (isNaN(parsedId)) { setError("Invalid subject ID"); setLoading(false); return; }
        const data = await atwSubjectService.getSubject(parsedId);
        if (data) {
          setSubject(data);
        } else {
          setError("Subject mapping not found");
        }
      } catch (err) {
        console.error("Failed to load subject mapping:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) {
      loadSubject();
    }
  }, [subjectId]);

  const handleSubmit = async (data: any) => {
    try {
      setSaveLoading(true);
      await atwSubjectService.updateSubject(parseInt(subjectId, 10), data);
      router.push("/atw/subjects");
    } catch (error) {
      console.error("Failed to update ATW subject:", error);
      throw error;
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/subjects");
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-center min-h-[40vh]">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-12">
        <Icon icon="hugeicons:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={handleCancel} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Subject Mapping</h2>
      </div>

      <div className="mx-auto">
        <SubjectForm
          initialData={subject}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saveLoading}
          isEdit={true}
        />
      </div>
    </div>
  );
}
