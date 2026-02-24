/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { atwSubjectService } from "@/libs/services/atwSubjectService";
import FullLogo from "@/components/ui/fulllogo";
import SubjectForm from "@/components/atw-subjects/SubjectForm";
import { Icon } from "@iconify/react";
import type { AtwSubject } from "@/libs/types/system";

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [subject, setSubject] = useState<AtwSubject | null>(null);
  const [error, setError] = useState("");

  // Load subject data
  useEffect(() => {
    const loadSubject = async () => {
      try {
        setLoadingSubject(true);
        const subjectData = await atwSubjectService.getSubject(parseInt(subjectId));
        if (subjectData) {
          setSubject(subjectData);
        } else {
          setError("Subject not found");
        }
      } catch (err) {
        console.error("Failed to load subject:", err);
        setError("Failed to load subject data. Please refresh the page.");
      } finally {
        setLoadingSubject(false);
      }
    };

    if (subjectId) {
      loadSubject();
    }
  }, [subjectId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await atwSubjectService.updateSubject(parseInt(subjectId), data);
      router.push("/atw/subjects");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/subjects");
  };

  if (loadingSubject) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading subject data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error}</p>
          <button onClick={() => router.push("/atw/subjects")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Subjects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Subject</h2>
      </div>

      <SubjectForm
        initialData={subject}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
