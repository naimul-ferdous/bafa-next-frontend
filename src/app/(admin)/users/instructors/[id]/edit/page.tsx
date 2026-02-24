/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { instructorService } from "@/libs/services/instructorService";
import InstructorForm from "@/components/instructors/InstructorForm";
import type { InstructorBiodata } from "@/libs/types/user";
import { Icon } from "@iconify/react";

export default function EditInstructorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [instructor, setInstructor] = useState<InstructorBiodata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        setLoading(true);
        const data = await instructorService.getInstructor(parseInt(id));
        if (data) {
          setInstructor(data);
        } else {
          setError("Instructor not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch instructor");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInstructor();
    }
  }, [id]);

  const handleSubmit = async (formData: any) => {
    setSaving(true);
    try {
      await instructorService.updateInstructor(parseInt(id), formData);
      router.push("/users/instructors");
    } catch (err: any) {
      throw err; // Form will handle the error display
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/users/instructors");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !instructor) {
    return (
      <div className="mx-auto py-12 text-center">
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
        <button 
          onClick={handleCancel}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <InstructorForm 
        initialData={instructor}
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={saving} 
        isEdit={true}
      />
    </div>
  );
}
