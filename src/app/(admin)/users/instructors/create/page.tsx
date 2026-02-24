/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { instructorService } from "@/libs/services/instructorService";
import InstructorForm from "@/components/instructors/InstructorForm";

export default function CreateInstructorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await instructorService.createInstructor(formData);
      router.push("/users/instructors");
    } catch (err: any) {
      throw err; // Form will handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/users/instructors");
  };

  return (
    <div className="mx-auto">
      <InstructorForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={loading} 
      />
    </div>
  );
}
