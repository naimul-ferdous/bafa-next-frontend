/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ftw12sqnGroundExaminationMarkService } from "@/libs/services/ftw12sqnGroundExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import type { Ftw12sqnGroundExaminationMark, Ftw12sqnGroundExaminationMarkCreateData } from "@/libs/types/ftw12sqnExamination";
import { Icon } from "@iconify/react";
import Ftw12sqnGroundExaminationMarkForm from "@/components/ftw-12sqn-ground-examination/Ftw12sqnGroundExaminationMarkForm";

export default function EditFtw12sqnGroundExaminationMarkPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [mark, setMark] = useState<Ftw12sqnGroundExaminationMark | null>(null);

  useEffect(() => {
    const fetchMark = async () => {
      try {
        setFetchLoading(true);
        const data = await ftw12sqnGroundExaminationMarkService.getMark(id);
        if (data) {
          setMark(data);
        } else {
          alert("Examination mark not found");
          router.push("/ftw/12sqn/results/ground/results");
        }
      } catch (error) {
        console.error("Failed to fetch examination mark:", error);
        alert("Failed to fetch examination mark");
        router.push("/ftw/12sqn/results/ground/results");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchMark();
    }
  }, [id, router]);

  const handleSubmit = async (data: Ftw12sqnGroundExaminationMarkCreateData) => {
    setLoading(true);
    try {
      await ftw12sqnGroundExaminationMarkService.updateMark(id, data);
      router.push("/ftw/12sqn/results/ground/results");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/results/ground/results");
  };

  if (fetchLoading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!mark) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <p className="text-gray-500">Examination mark not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="relative text-center mb-8">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          12SQN BAF - Ground Examination Mark Edit
        </h2>

        <div className="absolute top-0 left-0">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 px-4 py-2 bg-transparent hover:bg-gray-100 border border-gray-300 text-black rounded-md transition-colors"
            title="Go Back"
          >
            <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <Ftw12sqnGroundExaminationMarkForm
        initialData={mark}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
        isEdit={true}
      />
    </div>
  );
}
