"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import FullLogo from "@/components/ui/fulllogo";
import type { InstructorBiodata } from "@/libs/types/user";
import type { CadetProfile } from "@/libs/types/user";
import type { Ftw11sqnFlyingSyllabus, Ftw11sqnFlyingSyllabusExercise, Ftw11sqnGroundSyllabus, Ftw11sqnGroundSyllabusExercise } from "@/libs/types/ftw11sqnFlying";
import type { Ftw12sqnFlyingSyllabus, Ftw12sqnFlyingSyllabusExercise, Ftw12sqnGroundSyllabus, Ftw12sqnGroundSyllabusExercise } from "@/libs/types/ftw12sqnFlying";
import { ftw11sqnFlyingSyllabusService } from "@/libs/services/ftw11sqnFlyingSyllabusService";
import { ftw11sqnGroundSyllabusService } from "@/libs/services/ftw11sqnGroundSyllabusService";
import { ftw11sqnInstructorAssignmentService } from "@/libs/services/ftw11sqnInstructorAssignmentService";
import { ftw11sqnInstructorAssignGroundService } from "@/libs/services/ftw11sqnInstructorAssignGroundService";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import { ftw12sqnInstructorAssignmentService } from "@/libs/services/ftw12sqnInstructorAssignmentService";
import { ftw12sqnInstructorAssignGroundService } from "@/libs/services/ftw12sqnInstructorAssignGroundService";
import { instructorService } from "@/libs/services/instructorService";
import { commonService } from "@/libs/services/commonService";
import { SystemCourse, SystemSemester } from "@/libs/types/system";

const SvgIcon = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`inline-block shrink-0 ${className}`}
  >
    {children}
  </svg>
);

const Icons = {
  Calendar: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></SvgIcon>
  ),
  User: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></SvgIcon>
  ),
  Flight: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"></path></SvgIcon>
  ),
  Book: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></SvgIcon>
  ),
  CheckCircle: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></SvgIcon>
  ),
  Check: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><polyline points="20 6 9 17 4 12"></polyline></SvgIcon>
  ),
  Search: (props: { className?: string }) => (
    <SvgIcon className={`w-4.5 h-4.5 ${props.className || ""}`}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></SvgIcon>
  ),
  ArrowLeft: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></SvgIcon>
  ),
  ArrowRight: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></SvgIcon>
  ),
  ChevronDown: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><polyline points="6 9 12 15 18 9"></polyline></SvgIcon>
  ),
  ChevronUp: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><polyline points="18 15 12 9 6 15"></polyline></SvgIcon>
  ),
  X: (props: { className?: string }) => (
    <SvgIcon className={`w-4 h-4 ${props.className || ""}`}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></SvgIcon>
  ),
  Spinner: (props: { className?: string }) => (
    <svg 
      className={`animate-spin shrink-0 ${props.className || "w-4 h-4"}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
};

interface CadetAssignMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cadet: CadetProfile | null;
  onSuccess?: () => void;
  squadronType?: "11sqn" | "12sqn";
}

interface PhaseWithExercises extends Ftw11sqnFlyingSyllabus {
  allExercises: Ftw11sqnFlyingSyllabusExercise[];
}

interface PhaseWithExercises12Sqn extends Ftw12sqnFlyingSyllabus {
  allExercises: Ftw12sqnFlyingSyllabusExercise[];
}

interface GroundWithExercises extends Ftw11sqnGroundSyllabus {
  allExercises: Ftw11sqnGroundSyllabusExercise[];
}

interface GroundWithExercises12Sqn extends Ftw12sqnGroundSyllabus {
  allExercises: Ftw12sqnGroundSyllabusExercise[];
}

type AssignmentType = "flying" | "ground";

const STEPS_FLYING = [
  { key: 1, label: "Course & Semester", Icon: Icons.Calendar },
  { key: 2, label: "Instructor",        Icon: Icons.User },
  { key: 3, label: "Missions",          Icon: Icons.Flight },
  { key: 4, label: "Review",            Icon: Icons.CheckCircle },
] as const;

const STEPS_GROUND = [
  { key: 1, label: "Course & Semester", Icon: Icons.Calendar },
  { key: 2, label: "Instructor",        Icon: Icons.User },
  { key: 3, label: "Grounds",           Icon: Icons.Book },
  { key: 4, label: "Review",            Icon: Icons.CheckCircle },
] as const;

const makeKey = (missionId: number, exerciseId: number) => `${missionId}:${exerciseId}`;
const makeGroundKey = (groundId: number, exerciseId: number) => `g-${groundId}:${exerciseId}`;

export default function CadetAssignMissionModal({
  isOpen,
  onClose,
  cadet,
  onSuccess,
  squadronType = "11sqn",
}: CadetAssignMissionModalProps) {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("flying");
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [instructors, setInstructors] = useState<InstructorBiodata[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [instructorSearch, setInstructorSearch] = useState("");

  const [phases, setPhases] = useState<PhaseWithExercises[] | PhaseWithExercises12Sqn[]>([]);
  const [grounds, setGrounds] = useState<GroundWithExercises[] | GroundWithExercises12Sqn[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [missionSearch, setMissionSearch] = useState("");
  const [groundSearch, setGroundSearch] = useState("");
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [expandedGrounds, setExpandedGrounds] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState<"phase" | "exercise">("exercise");

  const [loadingData, setLoadingData] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [loadingSaveAll, setLoadingSaveAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAll = useCallback(() => {
    setSelectedCourseId(null);
    setSelectedSemesterId(null);
    setSemesters([]);
    setPhases([]);
    setGrounds([]);
    setSelectedKeys(new Set());
    setMissionSearch("");
    setGroundSearch("");
    setExpandedPhases(new Set());
    setExpandedGrounds(new Set());
    setSelectionMode("exercise");
    setInstructors([]);
    setSelectedInstructorId(null);
    setInstructorSearch("");
    setError(null);
    setStep(1);
    setAssignmentType("flying");
    setLoadingSaveAll(false);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoadingData(true);
    try {
      const options = await commonService.getResultOptions();
      setCourses(options?.courses || []);
      
      if (cadet) {
        const currentCourseId = cadet.assigned_courses?.find(c => c.is_current)?.course_id;
        const currentSemesterId = cadet.assigned_semesters?.find(s => s.is_current)?.semester_id;
        if (currentCourseId) setSelectedCourseId(currentCourseId);
        if (currentSemesterId) setSelectedSemesterId(currentSemesterId);
      }
    } catch {
      setError("Failed to load initial data");
    } finally {
      setLoadingData(false);
    }
  }, [cadet]);

  useEffect(() => {
    if (isOpen && cadet) loadInitial();
    if (!isOpen) resetAll();
  }, [isOpen, cadet, loadInitial, resetAll]);

  useEffect(() => {
    if (!selectedCourseId) {
      setSemesters([]);
      setSelectedSemesterId(null);
      return;
    }
    setLoadingSemesters(true);
    commonService
      .getSemestersByCourse(selectedCourseId)
      .then((data) => setSemesters(data.filter((s) => s.is_flying === true)))
      .catch(() => setSemesters([]))
      .finally(() => setLoadingSemesters(false));
  }, [selectedCourseId]);

  const loadInstructors = useCallback(() => {
    if (!selectedCourseId || !selectedSemesterId) return;
    setLoadingData(true);
    const is12Sqn = squadronType === "12sqn";
    instructorService.getAllInstructors({ per_page: 500 })
      .then(res => {
        const subWingStr = is12Sqn ? '12' : '11';
        const filteredInstructors = res.data.filter(i => {
          if (!i.sub_wing_data || i.sub_wing_data.length === 0) return true;
          return i.sub_wing_data.some(sw => sw.sub_wing?.name?.toLowerCase().includes(subWingStr) && sw.is_active);
        });
        setInstructors(filteredInstructors);
      })
      .catch(() => setError("Failed to load instructors"))
      .finally(() => setLoadingData(false));
  }, [selectedCourseId, selectedSemesterId, squadronType]);

  const loadMissions = useCallback(() => {
    if (!selectedSemesterId || !selectedCourseId || !selectedInstructorId || !cadet) return;
    setLoadingMissions(true);
    setError(null);
    
    const is12Sqn = squadronType === "12sqn";
    
    if (assignmentType === "flying") {
      Promise.all([
        is12Sqn 
          ? ftw12sqnFlyingSyllabusService.getAll({ per_page: 200, is_active: true, semester_id: selectedSemesterId })
          : ftw11sqnFlyingSyllabusService.getAll({ per_page: 200, is_active: true, semester_id: selectedSemesterId }),
        is12Sqn
          ? ftw12sqnInstructorAssignmentService.getAssignments({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, per_page: 500 })
          : ftw11sqnInstructorAssignmentService.getAssignments({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, per_page: 500 }),
      ])
        .then(([syllabusResult, assignments]) => {
          if (is12Sqn) {
            const built: PhaseWithExercises12Sqn[] = (syllabusResult as any).data
              .filter((p: any) => !p.semester_id || p.semester_id === selectedSemesterId)
              .map((phase: any) => {
                const allExercises: Ftw12sqnFlyingSyllabusExercise[] = [];
                phase.syllabus_types?.forEach((st: any) => { st.exercises?.forEach((ex: any) => { if (!allExercises.find((e) => e.id === ex.id)) allExercises.push(ex); }); });
                return { ...phase, allExercises };
              });
            setPhases(built);
            setExpandedPhases(new Set(built.map((p) => p.id)));
          } else {
            const built: PhaseWithExercises[] = (syllabusResult as any).data
              .filter((p: any) => !p.semester_id || p.semester_id === selectedSemesterId)
              .map((phase: any) => {
                const allExercises: Ftw11sqnFlyingSyllabusExercise[] = [];
                phase.syllabus_types?.forEach((st: any) => { st.exercises?.forEach((ex: any) => { if (!allExercises.find((e) => e.id === ex.id)) allExercises.push(ex); }); });
                return { ...phase, allExercises };
              });
            setPhases(built);
            setExpandedPhases(new Set(built.map((p) => p.id)));
          }

          const keys = new Set<string>();
          assignments.forEach((a: any) => {
            const isCadetAssigned = a.cadets?.some((c: any) => c.cadet_id === cadet.id);
            if (isCadetAssigned) { a.exercises?.forEach((e: any) => { keys.add(makeKey(a.mission_id, e.exercise_id)); }); }
          });
          setSelectedKeys(keys);
        })
        .catch(() => setError("Failed to load missions"))
        .finally(() => setLoadingMissions(false));
    } else {
      Promise.all([
        is12Sqn
          ? ftw12sqnGroundSyllabusService.getAll({ per_page: 200, is_active: true, semester_id: selectedSemesterId })
          : ftw11sqnGroundSyllabusService.getAll({ per_page: 200, is_active: true, semester_id: selectedSemesterId }),
        is12Sqn
          ? ftw12sqnInstructorAssignGroundService.getAssignments({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, per_page: 500 })
          : ftw11sqnInstructorAssignGroundService.getAssignments({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, per_page: 500 }),
      ])
        .then(([syllabusResult, assignments]) => {
          if (is12Sqn) {
            const built: GroundWithExercises12Sqn[] = (syllabusResult as any).data
              .filter((g: any) => !g.semester_id || g.semester_id === selectedSemesterId)
              .map((ground: any) => ({ ...ground, allExercises: ground.exercises || [] }));
            setGrounds(built);
            setExpandedGrounds(new Set(built.map((g) => g.id)));
          } else {
            const built: GroundWithExercises[] = (syllabusResult as any).data
              .filter((g: any) => !g.semester_id || g.semester_id === selectedSemesterId)
              .map((ground: any) => ({ ...ground, allExercises: ground.exercises || [] }));
            setGrounds(built);
            setExpandedGrounds(new Set(built.map((g) => g.id)));
          }

          const keys = new Set<string>();
          assignments.forEach((a: any) => {
            const isCadetAssigned = a.cadets?.some((c: any) => c.cadet_id === cadet.id);
            if (isCadetAssigned) { a.exercises?.forEach((e: any) => { keys.add(makeGroundKey(a.ground_id, e.exercise_id)); }); }
          });
          setSelectedKeys(keys);
        })
        .catch(() => setError("Failed to load grounds"))
        .finally(() => setLoadingMissions(false));
    }
  }, [selectedSemesterId, selectedCourseId, selectedInstructorId, cadet, assignmentType, squadronType]);

  const toggleExercise = (key: string) => {
    setSelectedKeys((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const togglePhaseExpand = (id: number) => {
    setExpandedPhases((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleGroundExpand = (id: number) => {
    setExpandedGrounds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const selectAllInPhase = (phase: PhaseWithExercises) => {
    const keys = phase.allExercises.map((ex) => makeKey(phase.id, ex.id));
    const allSelected = keys.every((k) => selectedKeys.has(k));
    setSelectedKeys((prev) => { const next = new Set(prev); if (allSelected) { keys.forEach((k) => next.delete(k)); } else { keys.forEach((k) => next.add(k)); } return next; });
  };

  const selectAllInGround = (ground: GroundWithExercises) => {
    const keys = ground.allExercises.map((ex) => makeGroundKey(ground.id, ex.id));
    const allSelected = keys.every((k) => selectedKeys.has(k));
    setSelectedKeys((prev) => { const next = new Set(prev); if (allSelected) { keys.forEach((k) => next.delete(k)); } else { keys.forEach((k) => next.add(k)); } return next; });
  };

  const isPhaseFullySelected = (phase: PhaseWithExercises) => phase.allExercises.length > 0 && phase.allExercises.every((ex) => selectedKeys.has(makeKey(phase.id, ex.id)));
  const isPhasePartiallySelected = (phase: PhaseWithExercises) => phase.allExercises.some((ex) => selectedKeys.has(makeKey(phase.id, ex.id))) && !isPhaseFullySelected(phase);
  const isGroundFullySelected = (ground: GroundWithExercises) => ground.allExercises.length > 0 && ground.allExercises.every((ex) => selectedKeys.has(makeGroundKey(ground.id, ex.id)));
  const isGroundPartiallySelected = (ground: GroundWithExercises) => ground.allExercises.some((ex) => selectedKeys.has(makeGroundKey(ground.id, ex.id))) && !isGroundFullySelected(ground);

  const handleSelectAllMissions = () => {
    const allKeys = phases.flatMap((p) => p.allExercises.map((ex) => makeKey(p.id, ex.id)));
    const allSelected = allKeys.every((k) => selectedKeys.has(k));
    setSelectedKeys(allSelected ? new Set() : new Set(allKeys));
  };

  const handleSelectAllGrounds = () => {
    const allKeys = grounds.flatMap((g) => g.allExercises.map((ex) => makeGroundKey(g.id, ex.id)));
    const allSelected = allKeys.every((k) => selectedKeys.has(k));
    setSelectedKeys(allSelected ? new Set() : new Set(allKeys));
  };

  const totalExercises = assignmentType === "flying" 
    ? phases.reduce((sum, p) => sum + p.allExercises.length, 0)
    : grounds.reduce((sum, g) => sum + g.allExercises.length, 0);
  const allSelected = totalExercises > 0 && selectedKeys.size === totalExercises;

  const filteredInstructors = instructorSearch.trim()
    ? instructors.filter(i => i.user?.name.toLowerCase().includes(instructorSearch.toLowerCase()) || (i.user?.service_number || "").toLowerCase().includes(instructorSearch.toLowerCase()))
    : instructors;

  const filteredPhases = missionSearch.trim()
    ? phases.map((phase) => { const q = missionSearch.toLowerCase(); const phaseMatches = phase.phase_full_name.toLowerCase().includes(q) || phase.phase_shortname.toLowerCase().includes(q) || (phase.phase_symbol ?? "").toLowerCase().includes(q); const matchedExercises = phase.allExercises.filter((ex) => ex.exercise_name.toLowerCase().includes(q) || ex.exercise_shortname.toLowerCase().includes(q)); if (phaseMatches) return phase; if (matchedExercises.length > 0) return { ...phase, allExercises: matchedExercises }; return null; }).filter(Boolean) as PhaseWithExercises[]
    : phases;

  const filteredGrounds = groundSearch.trim()
    ? grounds.map((ground) => { const q = groundSearch.toLowerCase(); const groundMatches = ground.ground_full_name.toLowerCase().includes(q) || ground.ground_shortname.toLowerCase().includes(q) || (ground.ground_symbol ?? "").toLowerCase().includes(q); const matchedExercises = ground.allExercises.filter((ex) => ex.exercise_name.toLowerCase().includes(q) || ex.exercise_shortname.toLowerCase().includes(q)); if (groundMatches) return ground; if (matchedExercises.length > 0) return { ...ground, allExercises: matchedExercises }; return null; }).filter(Boolean) as GroundWithExercises[]
    : grounds;

  useEffect(() => {
    const q = assignmentType === "flying" ? missionSearch.toLowerCase() : groundSearch.toLowerCase();
    if (!q) return;
    if (assignmentType === "flying") {
      const matched = phases.filter((p) => p.phase_full_name.toLowerCase().includes(q) || p.phase_shortname.toLowerCase().includes(q) || (p.phase_symbol ?? "").toLowerCase().includes(q) || p.allExercises.some((ex) => ex.exercise_name.toLowerCase().includes(q) || ex.exercise_shortname.toLowerCase().includes(q))).map((p) => p.id);
      setExpandedPhases(new Set(matched));
    } else {
      const matched = grounds.filter((g) => g.ground_full_name.toLowerCase().includes(q) || g.ground_shortname.toLowerCase().includes(q) || (g.ground_symbol ?? "").toLowerCase().includes(q) || g.allExercises.some((ex) => ex.exercise_name.toLowerCase().includes(q) || ex.exercise_shortname.toLowerCase().includes(q))).map((g) => g.id);
      setExpandedGrounds(new Set(matched));
    }
  }, [missionSearch, groundSearch, assignmentType, phases, grounds]);

  const goToStep2 = () => { setStep(2); loadInstructors(); };
  const goToStep3 = () => { setStep(3); loadMissions(); };

  const handleSaveAll = async () => {
    if (!cadet || !selectedInstructorId || !selectedCourseId || !selectedSemesterId) return;
    setLoadingSaveAll(true);
    setError(null);
    const is12Sqn = squadronType === "12sqn";
    
    try {
      if (assignmentType === "flying") {
        const missionPayload = selectedMissionPhases.map(phase => ({
          mission_id: phase.id,
          exercise_ids: phase.allExercises.filter(ex => selectedKeys.has(makeKey(phase.id, ex.id))).map(ex => ex.id),
          cadet_ids: [cadet.id]
        }));
        if (is12Sqn) {
          await ftw12sqnInstructorAssignmentService.sync({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, missions: missionPayload });
        } else {
          await ftw11sqnInstructorAssignmentService.sync({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, missions: missionPayload });
        }
      } else {
        const groundPayload = selectedGroundGrounds.map(ground => ({
          ground_id: ground.id,
          exercise_ids: ground.allExercises.filter(ex => selectedKeys.has(makeGroundKey(ground.id, ex.id))).map(ex => ex.id),
          cadet_ids: [cadet.id]
        }));
        if (is12Sqn) {
          await ftw12sqnInstructorAssignGroundService.sync({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, grounds: groundPayload });
        } else {
          await ftw11sqnInstructorAssignGroundService.sync({ instructor_id: selectedInstructorId, course_id: selectedCourseId, semester_id: selectedSemesterId, grounds: groundPayload });
        }
      }
        onSuccess?.();
        onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save assignments");
    } finally {
      setLoadingSaveAll(false);
    }
  };

  const handleClose = () => { resetAll(); onClose(); };
  const handleTypeChange = (type: AssignmentType) => { setAssignmentType(type); setSelectedKeys(new Set()); };

  const selectedMissionPhases = phases.filter((p) => p.allExercises.some((ex) => selectedKeys.has(makeKey(p.id, ex.id))));
  const selectedGroundGrounds = grounds.filter((g) => g.allExercises.some((ex) => selectedKeys.has(makeGroundKey(g.id, ex.id))));

  const currentSteps = assignmentType === "flying" ? STEPS_FLYING : STEPS_GROUND;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-2xl">
      <div className="p-6">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Assign Instructor & {assignmentType === "flying" ? "Missions" : "Grounds"}</h2>
          <p className="text-sm text-gray-500">{cadet?.name || "Cadet"} ({cadet?.cadet_number || "N/A"})</p>
        </div>

        <div className="flex mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button type="button" onClick={() => handleTypeChange("flying")} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${assignmentType === "flying" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            <Icons.Flight className="w-4 h-4" /> Flying Missions
          </button>
          <button type="button" onClick={() => handleTypeChange("ground")} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${assignmentType === "ground" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            <Icons.Book className="w-4 h-4" /> Ground Exams
          </button>
        </div>

        {loadingData && step === 1 ? (
          <div className="flex items-center justify-center py-10"><Icons.Spinner className="w-8 h-8 text-blue-500" /></div>
        ) : (
          <>
            <div className="flex items-center mb-5">
              {currentSteps.map((s, idx) => {
                const done = step > s.key;
                const cur  = step === s.key;
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${done ? "bg-green-500 text-white" : cur ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-100 text-gray-400"}`}>
                        {done
                          ? <Icons.Check className="w-4 h-4" />
                          : <s.Icon className="w-4 h-4" />
                        }
                      </div>
                      <span className={`text-xs mt-1 font-medium whitespace-nowrap ${cur ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < currentSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > s.key ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {step === 1 && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Course <span className="text-red-500">*</span></label>
                    <select value={selectedCourseId ?? ""} onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Course</option>
                      {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Semester <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select value={selectedSemesterId ?? ""} onChange={(e) => setSelectedSemesterId(e.target.value ? Number(e.target.value) : null)} disabled={!selectedCourseId || loadingSemesters} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400">
                        <option value="">{loadingSemesters ? "Loading..." : !selectedCourseId ? "Select course first" : "Select Semester"}</option>
                        {semesters.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                      </select>
                      {loadingSemesters && <Icons.Spinner className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-400" />}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Close</button>
                  <button type="button" onClick={goToStep2} disabled={!selectedCourseId || !selectedSemesterId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm">
                    Next: Instructor <Icons.ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="relative mb-3">
                  <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={instructorSearch} onChange={(e) => setInstructorSearch(e.target.value)} placeholder="Search instructor by name or BD number..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-4">
                  {filteredInstructors.length === 0 ? (<p className="text-center text-gray-500 py-4 text-sm">No instructors found</p>) : (
                    filteredInstructors.map((inst) => (
                      <div key={inst.id} onClick={() => setSelectedInstructorId(inst.user_id)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedInstructorId === inst.user_id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${selectedInstructorId === inst.user_id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                          {selectedInstructorId === inst.user_id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{inst.user?.name}</p>
                          <p className="text-xs text-gray-500">{inst.user?.rank?.short_name || inst.user?.rank?.name || "Instructor"} · {inst.user?.service_number}</p>
                        </div>
                        <Icons.User className={`w-5 h-5 ${selectedInstructorId === inst.user_id ? 'text-blue-500' : 'text-gray-300'}`} />
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"><Icons.ArrowLeft className="w-4 h-4" /> Back</button>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Close</button>
                    <button type="button" onClick={goToStep3} disabled={!selectedInstructorId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm">
                      Next: {assignmentType === "flying" ? "Missions" : "Grounds"} <Icons.ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                {loadingMissions ? (
                  <div className="flex items-center justify-center py-10"><Icons.Spinner className="w-8 h-8 text-blue-500" /></div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Select {assignmentType === "flying" ? "Missions" : "Grounds"}</label>
                        {totalExercises > 0 && (<button type="button" onClick={assignmentType === "flying" ? handleSelectAllMissions : handleSelectAllGrounds} className="text-xs text-blue-600 hover:text-blue-700">{allSelected ? "Deselect All" : "Select All"}</button>)}
                      </div>
                      <div className="relative mb-3">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={assignmentType === "flying" ? missionSearch : groundSearch} onChange={(e) => assignmentType === "flying" ? setMissionSearch(e.target.value) : setGroundSearch(e.target.value)} placeholder={`Search ${assignmentType === "flying" ? "mission" : "ground"} or exercise...`} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {(missionSearch || groundSearch) && (<button type="button" onClick={() => { assignmentType === "flying" ? setMissionSearch("") : setGroundSearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Icons.X className="w-4 h-4" /></button>)}
                      </div>
                      {(assignmentType === "flying" ? filteredPhases : filteredGrounds).length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">{assignmentType === "flying" ? missionSearch ? `No results for "${missionSearch}"` : "No missions found for this semester" : groundSearch ? `No results for "${groundSearch}"` : "No grounds found for this semester"}</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {(assignmentType === "flying" ? filteredPhases : filteredGrounds).map((item) => {
                            const isPhase = assignmentType === "flying";
                            const isExpanded = isPhase ? expandedPhases.has(item.id) : expandedGrounds.has(item.id);
                            const allExercises = isPhase ? (item as PhaseWithExercises).allExercises : (item as GroundWithExercises).allExercises;
                            const isFullySelected = isPhase ? isPhaseFullySelected(item as PhaseWithExercises) : isGroundFullySelected(item as GroundWithExercises);
                            const isPartiallySelected = isPhase ? isPhasePartiallySelected(item as PhaseWithExercises) : isGroundPartiallySelected(item as GroundWithExercises);
                            const selectedCount = allExercises.filter((ex) => selectedKeys.has(isPhase ? makeKey(item.id, ex.id) : makeGroundKey(item.id, ex.id))).length;
                            
                            return (
                              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer" onClick={() => isPhase ? selectAllInPhase(item as PhaseWithExercises) : selectAllInGround(item as GroundWithExercises)}>
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isFullySelected ? 'bg-blue-600 border-blue-600 text-white' : isPartiallySelected ? 'bg-blue-100 border-blue-400 text-blue-600' : 'bg-white border-gray-300'}`}>
                                    {isFullySelected ? <Icons.Check className="w-3 h-3" /> : isPartiallySelected ? <div className="w-2 h-0.5 bg-blue-600 rounded-full" /> : null}
                                  </div>
                                  <div className="flex-1 flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-800">
                                      {isPhase ? (item as any).phase_symbol ? `[${(item as any).phase_symbol}] ` : "" : (item as any).ground_symbol ? `[${(item as any).ground_symbol}] ` : ""}
                                      {isPhase ? (item as any).phase_full_name : (item as any).ground_full_name}
                                    </span>
                                    {allExercises.length > 0 && <span className="text-xs text-gray-400 ml-auto">{selectedCount}/{allExercises.length}</span>}
                                  </div>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); isPhase ? togglePhaseExpand(item.id) : toggleGroundExpand(item.id); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
                                    {isExpanded ? <Icons.ChevronUp className="w-4 h-4" /> : <Icons.ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                                {isExpanded && (
                                  allExercises.length === 0 ? (
                                    <p className="text-xs text-gray-400 px-4 py-2">No exercises</p>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-1 p-2 bg-white">
                                      {allExercises.map((ex) => {
                                        const key = isPhase ? makeKey(item.id, ex.id) : makeGroundKey(item.id, ex.id);
                                        const isSelected = selectedKeys.has(key);
                                        return (
                                          <div key={ex.id} onClick={() => toggleExercise(key)} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-100 hover:bg-gray-100"}`}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                                              {isSelected && <Icons.Check className="w-2.5 h-2.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-gray-900 truncate">{ex.exercise_shortname}</p>
                                              {ex.exercise_name !== ex.exercise_shortname && <p className="text-xs text-gray-400 truncate">{ex.exercise_name}</p>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {selectedKeys.size > 0 && <p className="mt-2 text-xs text-blue-600 font-medium">{selectedKeys.size} exercise(s) selected</p>}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"><Icons.ArrowLeft className="w-4 h-4" /> Back</button>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Close</button>
                        <button type="button" onClick={() => setStep(4)} disabled={selectedKeys.size === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm">Next: Review <Icons.ArrowRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Assignment Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-500 uppercase font-medium">Cadet</p><p className="text-sm font-medium text-gray-900">{cadet?.name}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase font-medium">Instructor</p><p className="text-sm font-medium text-gray-900">{instructors.find(i => i.user_id === selectedInstructorId)?.user?.name || "—"}</p></div>
                    <div><p className="text-xs text-gray-500 uppercase font-medium">Type</p><p className="text-sm font-medium text-gray-900">{assignmentType === "flying" ? "Flying Missions" : "Ground Exams"}</p></div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-2">{assignmentType === "flying" ? "Missions" : "Grounds"} Selected</p>
                    <div className="flex flex-wrap gap-2">
                      {(assignmentType === "flying" ? selectedMissionPhases : selectedGroundGrounds).map((p: any) => (
                        <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                          <Icons.CheckCircle className="w-3 h-3" />
                          {p.phase_symbol || p.ground_symbol || p.phase_shortname || p.ground_shortname}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t mt-6">
                  <button type="button" onClick={() => setStep(3)} disabled={loadingSaveAll} className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"><Icons.ArrowLeft className="w-4 h-4" /> Back</button>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={handleClose} disabled={loadingSaveAll} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50">Close</button>
                    <button type="button" onClick={handleSaveAll} disabled={loadingSaveAll} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold">
                      {loadingSaveAll ? <><Icons.Spinner className="text-white" /> Saving...</> : <><Icons.CheckCircle className="w-4 h-4" /> Save Everything</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}