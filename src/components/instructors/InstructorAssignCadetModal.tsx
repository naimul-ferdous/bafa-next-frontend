/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { cadetService } from "@/libs/services/cadetService";
import { commonService } from "@/libs/services/commonService";
import type { InstructorBiodata } from "@/libs/types/user";
import type { AtwSubjectModule, SystemCourse, SystemSemester, SystemProgram } from "@/libs/types/system";
import { Icon } from "@iconify/react";
import FullLogo from "../ui/fulllogo";

interface InstructorAssignCadetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instructor: InstructorBiodata | null;
}

export default function InstructorAssignCadetModal({ isOpen, onClose, onSuccess, instructor }: InstructorAssignCadetModalProps) {
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [subjects, setSubjects] = useState<AtwSubjectModule[]>([]);
  const [cadets, setCadets] = useState<any[]>([]);
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedCadetIds, setSelectedCadetIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedCourseId("");
      setSelectedSemesterId("");
      setSelectedProgramId("");
      setSelectedSubjectId("");
      setSelectedCadetIds([]);
      setError(null);
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const options = await commonService.getResultOptions();
      if (options) {
        setCourses(options.courses);
        setPrograms(options.programs);
      }
    } catch (err) {
      console.error("Failed to load options:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Load semesters when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setSemesters([]);
      return;
    }
    const fetchSemesters = async () => {
      const data = await commonService.getSemestersByCourse(Number(selectedCourseId));
      setSemesters(data);
    };
    fetchSemesters();
  }, [selectedCourseId]);

  // Load cadets based on filters
  useEffect(() => {
    if (!selectedCourseId || !selectedSemesterId) {
      setCadets([]);
      return;
    }
    const fetchCadets = async () => {
      setLoadingCadets(true);
      try {
        const res = await cadetService.getAllCadets({
          course_id: Number(selectedCourseId),
          semester_id: Number(selectedSemesterId),
          program_id: selectedProgramId ? Number(selectedProgramId) : undefined,
          is_current: 1,
          per_page: 500,
        });
        setCadets(res.data);
      } catch (err) {
        console.error("Failed to load cadets:", err);
      } finally {
        setLoadingCadets(false);
      }
    };
    fetchCadets();
  }, [selectedCourseId, selectedSemesterId, selectedProgramId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("This feature is currently disabled as requested.");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-4xl">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Assign Cadets to Instructor</h2>
          <p className="text-sm text-gray-500">Feature disabled as requested.</p>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </Modal>
  );
}
