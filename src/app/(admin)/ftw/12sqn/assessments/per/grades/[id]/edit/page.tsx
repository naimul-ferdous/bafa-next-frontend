"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ftw12sqnAssessmentPenpictureGradeService } from "@/libs/services/ftw12sqnAssessmentPenpictureGradeService";
import FullLogo from "@/components/ui/fulllogo";
import GradeForm, { GradeFormData } from "@/components/ftw-12sqn-assessment-penpicture-grades/GradeForm";
import { Icon } from "@iconify/react";
import type { Ftw12SqnAssessmentPenpictureGrade } from "@/libs/types/system";

export default function EditGradePage() {
  const router = useRouter();
  const params = useParams();
  const gradeId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingGrade, setLoadingGrade] = useState(true);
  const [grade, setGrade] = useState<Ftw12SqnAssessmentPenpictureGrade | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGrade = async () => {
      try {
        setLoadingGrade(true);
        const gradeData = await ftw12sqnAssessmentPenpictureGradeService.getGrade(parseInt(gradeId));
        if (gradeData) {
          setGrade(gradeData);
        } else {
          setError("Grade not found");
        }
      } catch (err) {
        console.error("Failed to load grade:", err);
        setError("Failed to load grade data. Please refresh the page.");
      } finally {
        setLoadingGrade(false);
      }
    };

    if (gradeId) {
      loadGrade();
    }
  }, [gradeId]);

  const handleSubmit = async (data: GradeFormData) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        course_id: Number(data.course_id),
      };
      await ftw12sqnAssessmentPenpictureGradeService.updateGrade(parseInt(gradeId), submitData);
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

  if (loadingGrade) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading grade data...</p>
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
          <button onClick={() => router.push("/ftw12sqn/assessments/penpicture/grades")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Grades
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Assessment Grade</h2>
      </div>

      <GradeForm
        initialData={grade}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
