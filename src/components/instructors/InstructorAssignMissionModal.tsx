"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import FullLogo from "@/components/ui/fulllogo";
import { Icons } from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import type { InstructorBiodata, InstructorAssignWing } from "@/libs/types/user";
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
import { instructorAssignWingService } from "@/libs/services/instructorAssignWingService";
import { cadetService } from "@/libs/services/cadetService";
import { commonService } from "@/libs/services/commonService";

interface InstructorAssignMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: InstructorBiodata | null;
  onSuccess?: () => void;
  squadronType?: "11sqn" | "12sqn";
}

interface PhaseWithExercises extends Ftw11sqnFlyingSyllabus {
  allExercises: Ftw11sqnFlyingSyllabusExercise[];
}

interface GroundWithExercises extends Ftw11sqnGroundSyllabus {
  allExercises: Ftw11sqnGroundSyllabusExercise[];
}

type AssignmentType = "flying" | "ground";
type SelectionMode = "phase" | "exercise";

const STEPS_FLYING = [
  { key: 1, label: "Course & Semester", icon: "calendar" },
  { key: 2, label: "Missions",          icon: "flight"   },
  { key: 3, label: "Cadets",            icon: "userGroup"  },
  { key: 4, label: "Review",            icon: "checkCircle" },
] as const;

const STEPS_GROUND = [
  { key: 1, label: "Course & Semester", icon: "calendar" },
  { key: 2, label: "Grounds",            icon: "book"     },
  { key: 3, label: "Cadets",            icon: "userGroup"  },
  { key: 4, label: "Review",            icon: "checkCircle" },
] as const;

const makeKey = (missionId: number, exerciseId: number) => `${missionId}:${exerciseId}`;
const makeGroundKey = (groundId: number, exerciseId: number) => `g-${groundId}:${exerciseId}`;

export default function InstructorAssignMissionModal({
  isOpen,
  onClose,
  instructor,
  onSuccess,
  squadronType = "11sqn",
}: InstructorAssignMissionModalProps) {
  const { user: authUser } = useAuth();

  const authSubWing =
    authUser?.roleAssignments?.find((ra) => ra.is_active && ra.sub_wing_id)?.sub_wing ??
    authUser?.role_assignments?.find((ra) => ra.is_active && ra.sub_wing_id)?.sub_wing ??
    null;

  const [assignmentType, setAssignmentType] = useState<AssignmentType>("flying");
  const [step, setStep] = useState(1);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("exercise");

  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [instructorWings, setInstructorWings] = useState<InstructorAssignWing[]>([]);

  // Flying state
  const [phases, setPhases] = useState<PhaseWithExercises[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Ground state
  const [grounds, setGrounds] = useState<GroundWithExercises[]>([]);
  const [selectedGroundKeys, setSelectedGroundKeys] = useState<Set<string>>(new Set());
  const [expandedGrounds, setExpandedGrounds] = useState<Set<number>>(new Set());
  const [groundSearchQuery, setGroundSearchQuery] = useState("");

  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [cadetSearch, setCadetSearch] = useState("");
  const [cadetAssignments, setCadetAssignments] = useState<Map<number, Set<number>>>(new Map());
  const [groundCadetAssignments, setGroundCadetAssignments] = useState<Map<number, Set<number>>>(new Map());
  const [expandedCadetPhases, setExpandedCadetPhases] = useState<Set<number>>(new Set());
  const [expandedCadetGrounds, setExpandedCadetGrounds] = useState<Set<number>>(new Set());

  const [loadingData, setLoadingData] = useState(true);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [loadingGrounds, setLoadingGrounds] = useState(false);
  const [loadingSaveAll, setLoadingSaveAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cadetError, setCadetError] = useState<string | null>(null);

  const resetAll = useCallback(() => {
    setSelectedCourseId(null);
    setSelectedSemesterId(null);
    setSemesters([]);
    setPhases([]);
    setGrounds([]);
    setSelectedKeys(new Set());
    setSelectedGroundKeys(new Set());
    setExpandedPhases(new Set());
    setExpandedGrounds(new Set());
    setSearchQuery("");
    setGroundSearchQuery("");
    setCadets([]);
    setCadetSearch("");
    setCadetAssignments(new Map());
    setGroundCadetAssignments(new Map());
    setExpandedCadetPhases(new Set());
    setExpandedCadetGrounds(new Set());
    setInstructorWings([]);
    setError(null);
    setCadetError(null);
    setStep(1);
    setSelectionMode("exercise");
    setLoadingSaveAll(false);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoadingData(true);
    try {
      const [options, wings] = await Promise.all([
        commonService.getResultOptions(),
        instructor?.user_id
          ? instructorAssignWingService.getByInstructor(instructor.user_id)
          : Promise.resolve([]),
      ]);
      setCourses(options?.courses || []);
      setInstructorWings(wings);
    } catch {
      setError("Failed to load initial data");
    } finally {
      setLoadingData(false);
    }
  }, [instructor?.user_id]);

  useEffect(() => {
    if (isOpen && instructor) {
      loadInitial();
    }
    if (!isOpen) {
      resetAll();
    }
  }, [isOpen, instructor, loadInitial, resetAll]);

  useEffect(() => {
    if (!selectedCourseId) {
      setSemesters([]);
      setSelectedSemesterId(null);
      setPhases([]);
      setGrounds([]);
      setSelectedKeys(new Set());
      setSelectedGroundKeys(new Set());
      return;
    }
    setLoadingSemesters(true);
    setSelectedSemesterId(null);
    setPhases([]);
    setGrounds([]);
    setSelectedKeys(new Set());
    setSelectedGroundKeys(new Set());
    commonService
      .getSemestersByCourse(selectedCourseId)
      .then((data) => setSemesters(data.filter((s) => s.is_flying === true)))
      .catch(() => setSemesters([]))
      .finally(() => setLoadingSemesters(false));
  }, [selectedCourseId]);

  const loadMissions = useCallback(() => {
    if (!selectedSemesterId || !selectedCourseId || !instructor?.user?.id) return;
    setLoadingPhases(true);
    setError(null);
    const is12Sqn = squadronType === "12sqn";
    Promise.all([
      (is12Sqn ? ftw12sqnFlyingSyllabusService : ftw11sqnFlyingSyllabusService).getAll({
        per_page: 200,
        is_active: true,
        semester_id: selectedSemesterId,
      }),
      (is12Sqn ? ftw12sqnInstructorAssignmentService : ftw11sqnInstructorAssignmentService).getAssignments({
        instructor_id: instructor.user.id,
        course_id: selectedCourseId,
        semester_id: selectedSemesterId,
        per_page: 500,
      }),
    ])
      .then(([syllabusResult, assignments]) => {
        const built: PhaseWithExercises[] = syllabusResult.data
          .filter((p) => !p.semester_id || p.semester_id === selectedSemesterId)
          .map((phase) => {
            const allExercises: Ftw11sqnFlyingSyllabusExercise[] = [];
            phase.syllabus_types?.forEach((st) => {
              st.exercises?.forEach((ex) => {
                if (!allExercises.find((e) => e.id === ex.id)) allExercises.push(ex);
              });
            });
            return { ...phase, allExercises };
          });
        setPhases(built);
        setExpandedPhases(new Set(built.map((p) => p.id)));
        setExpandedCadetPhases(new Set(built.map((p) => p.id)));

        const keys = new Set<string>();
        const cadetMap = new Map<number, Set<number>>();

        assignments.forEach(a => {
          a.exercises?.forEach(e => {
            keys.add(makeKey(a.mission_id, e.exercise_id));
          });
          
          if (!cadetMap.has(a.mission_id)) cadetMap.set(a.mission_id, new Set());
          a.cadets?.forEach(c => {
            cadetMap.get(a.mission_id)!.add(c.cadet_id);
          });
        });

        setSelectedKeys(keys);
        setCadetAssignments(cadetMap);
      })
      .catch(() => setError("Failed to load missions"))
      .finally(() => setLoadingPhases(false));
  }, [selectedSemesterId, selectedCourseId, instructor]);

  const loadGrounds = useCallback(() => {
    if (!selectedSemesterId || !selectedCourseId || !instructor?.user?.id) return;
    setLoadingGrounds(true);
    setError(null);
    const is12Sqn = squadronType === "12sqn";
    Promise.all([
      (is12Sqn ? ftw12sqnGroundSyllabusService : ftw11sqnGroundSyllabusService).getAll({
        per_page: 200,
        is_active: true,
        semester_id: selectedSemesterId,
      }),
      (is12Sqn ? ftw12sqnInstructorAssignGroundService : ftw11sqnInstructorAssignGroundService).getAssignments({
        instructor_id: instructor.user.id,
        course_id: selectedCourseId,
        semester_id: selectedSemesterId,
        per_page: 500,
      }),
    ])
      .then(([syllabusResult, assignments]) => {
        const built: GroundWithExercises[] = syllabusResult.data
          .filter((g) => !g.semester_id || g.semester_id === selectedSemesterId)
          .map((ground) => ({
            ...ground,
            allExercises: ground.exercises || [],
          }));
        setGrounds(built);
        setExpandedGrounds(new Set(built.map((g) => g.id)));
        setExpandedCadetGrounds(new Set(built.map((g) => g.id)));

        const keys = new Set<string>();
        const cadetMap = new Map<number, Set<number>>();

        assignments.forEach(a => {
          a.exercises?.forEach(e => {
            keys.add(makeGroundKey(a.ground_id, e.exercise_id));
          });
          
          if (!cadetMap.has(a.ground_id)) cadetMap.set(a.ground_id, new Set());
          a.cadets?.forEach(c => {
            cadetMap.get(a.ground_id)!.add(c.cadet_id);
          });
        });

        setSelectedGroundKeys(keys);
        setGroundCadetAssignments(cadetMap);
      })
      .catch(() => setError("Failed to load grounds"))
      .finally(() => setLoadingGrounds(false));
  }, [selectedSemesterId, selectedCourseId, instructor]);

  const loadCadets = useCallback(() => {
    if (!selectedCourseId || !selectedSemesterId || cadets.length > 0) return;
    setLoadingCadets(true);
    cadetService
      .getAllCadets({
        course_id: selectedCourseId,
        semester_id: selectedSemesterId,
        is_current: 1,
        per_page: 500,
      })
      .then((res) => setCadets(res.data))
      .catch(() => setCadetError("Failed to load cadets"))
      .finally(() => setLoadingCadets(false));
  }, [selectedCourseId, selectedSemesterId, cadets.length]);

  const toggleExercise = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroundExercise = (key: string) => {
    setSelectedGroundKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePhaseExpand = (id: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroundExpand = (id: number) => {
    setExpandedGrounds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInPhase = (phase: PhaseWithExercises) => {
    const keys = phase.allExercises.map((ex) => makeKey(phase.id, ex.id));
    const allSelected = keys.every((k) => selectedKeys.has(k));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const selectAllInGround = (ground: GroundWithExercises) => {
    const keys = ground.allExercises.map((ex) => makeGroundKey(ground.id, ex.id));
    const allSelected = keys.every((k) => selectedGroundKeys.has(k));
    setSelectedGroundKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const isPhaseFullySelected = (phase: PhaseWithExercises) =>
    phase.allExercises.length > 0 &&
    phase.allExercises.every((ex) => selectedKeys.has(makeKey(phase.id, ex.id)));

  const isPhasePartiallySelected = (phase: PhaseWithExercises) =>
    phase.allExercises.some((ex) => selectedKeys.has(makeKey(phase.id, ex.id))) &&
    !isPhaseFullySelected(phase);

  const isGroundFullySelected = (ground: GroundWithExercises) =>
    ground.allExercises.length > 0 &&
    ground.allExercises.every((ex) => selectedGroundKeys.has(makeGroundKey(ground.id, ex.id)));

  const isGroundPartiallySelected = (ground: GroundWithExercises) =>
    ground.allExercises.some((ex) => selectedGroundKeys.has(makeGroundKey(ground.id, ex.id))) &&
    !isGroundFullySelected(ground);

  const handleSelectAll = () => {
    const allKeys = phases.flatMap((p) => p.allExercises.map((ex) => makeKey(p.id, ex.id)));
    const allSelected = allKeys.every((k) => selectedKeys.has(k));
    setSelectedKeys(allSelected ? new Set() : new Set(allKeys));
  };

  const handleSelectAllGround = () => {
    const allKeys = grounds.flatMap((g) => g.allExercises.map((ex) => makeGroundKey(g.id, ex.id)));
    const allSelected = allKeys.every((k) => selectedGroundKeys.has(k));
    setSelectedGroundKeys(allSelected ? new Set() : new Set(allKeys));
  };

  const selectedMissionPhases = phases.filter((p) =>
    p.allExercises.some((ex) => selectedKeys.has(makeKey(p.id, ex.id)))
  );

  const selectedGroundGrounds = grounds.filter((g) =>
    g.allExercises.some((ex) => selectedGroundKeys.has(makeGroundKey(g.id, ex.id)))
  );

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const matched = phases
      .filter(
        (p) =>
          p.phase_full_name.toLowerCase().includes(q) ||
          p.phase_shortname.toLowerCase().includes(q) ||
          (p.phase_symbol ?? "").toLowerCase().includes(q) ||
          p.allExercises.some(
            (ex) =>
              ex.exercise_name.toLowerCase().includes(q) ||
              ex.exercise_shortname.toLowerCase().includes(q)
          )
      )
      .map((p) => p.id);
    setExpandedPhases(new Set(matched));
  }, [searchQuery, phases]);

  useEffect(() => {
    if (!groundSearchQuery.trim()) return;
    const q = groundSearchQuery.toLowerCase();
    const matched = grounds
      .filter(
        (g) =>
          g.ground_full_name.toLowerCase().includes(q) ||
          g.ground_shortname.toLowerCase().includes(q) ||
          (g.ground_symbol ?? "").toLowerCase().includes(q) ||
          g.allExercises.some(
            (ex) =>
              ex.exercise_name.toLowerCase().includes(q) ||
              ex.exercise_shortname.toLowerCase().includes(q)
          )
      )
      .map((g) => g.id);
    setExpandedGrounds(new Set(matched));
  }, [groundSearchQuery, grounds]);

  const filteredPhases = searchQuery.trim()
    ? phases
        .map((phase) => {
          const q = searchQuery.toLowerCase();
          const phaseMatches =
            phase.phase_full_name.toLowerCase().includes(q) ||
            phase.phase_shortname.toLowerCase().includes(q) ||
            (phase.phase_symbol ?? "").toLowerCase().includes(q);
          const matchedExercises = phase.allExercises.filter(
            (ex) =>
              ex.exercise_name.toLowerCase().includes(q) ||
              ex.exercise_shortname.toLowerCase().includes(q)
          );
          if (phaseMatches) return phase;
          if (matchedExercises.length > 0) return { ...phase, allExercises: matchedExercises };
          return null;
        })
        .filter(Boolean) as PhaseWithExercises[]
    : phases;

  const filteredGrounds = groundSearchQuery.trim()
    ? grounds
        .map((ground) => {
          const q = groundSearchQuery.toLowerCase();
          const groundMatches =
            ground.ground_full_name.toLowerCase().includes(q) ||
            ground.ground_shortname.toLowerCase().includes(q) ||
            (ground.ground_symbol ?? "").toLowerCase().includes(q);
          const matchedExercises = ground.allExercises.filter(
            (ex) =>
              ex.exercise_name.toLowerCase().includes(q) ||
              ex.exercise_shortname.toLowerCase().includes(q)
          );
          if (groundMatches) return ground;
          if (matchedExercises.length > 0) return { ...ground, allExercises: matchedExercises };
          return null;
        })
        .filter(Boolean) as GroundWithExercises[]
    : grounds;

  const totalExercises = phases.reduce((sum, p) => sum + p.allExercises.length, 0);
  const allSelected = totalExercises > 0 && selectedKeys.size === totalExercises;

  const totalGroundExercises = grounds.reduce((sum, g) => sum + g.allExercises.length, 0);
  const allGroundSelected = totalGroundExercises > 0 && selectedGroundKeys.size === totalGroundExercises;

  const toggleCadetForMission = (missionId: number, cadetId: number) => {
    setCadetAssignments((prev) => {
      const next = new Map(prev);
      const existing = new Set(next.get(missionId) ?? []);
      if (existing.has(cadetId)) existing.delete(cadetId);
      else existing.add(cadetId);
      next.set(missionId, existing);
      return next;
    });
  };

  const toggleCadetForGround = (groundId: number, cadetId: number) => {
    setGroundCadetAssignments((prev) => {
      const next = new Map(prev);
      const existing = new Set(next.get(groundId) ?? []);
      if (existing.has(cadetId)) existing.delete(cadetId);
      else existing.add(cadetId);
      next.set(groundId, existing);
      return next;
    });
  };

  const selectAllCadetsForMission = (missionId: number, filteredCadetIds: number[]) => {
    setCadetAssignments((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(missionId) ?? []);
      const allIn = filteredCadetIds.every((id) => current.has(id));
      if (allIn) {
        filteredCadetIds.forEach((id) => current.delete(id));
      } else {
        filteredCadetIds.forEach((id) => current.add(id));
      }
      next.set(missionId, current);
      return next;
    });
  };

  const selectAllCadetsForGround = (groundId: number, filteredCadetIds: number[]) => {
    setGroundCadetAssignments((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(groundId) ?? []);
      const allIn = filteredCadetIds.every((id) => current.has(id));
      if (allIn) {
        filteredCadetIds.forEach((id) => current.delete(id));
      } else {
        filteredCadetIds.forEach((id) => current.add(id));
      }
      next.set(groundId, current);
      return next;
    });
  };

  const toggleCadetPhaseExpand = (id: number) => {
    setExpandedCadetPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCadetGroundExpand = (id: number) => {
    setExpandedCadetGrounds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCadets = cadetSearch.trim()
    ? cadets.filter(
        (c) =>
          c.name.toLowerCase().includes(cadetSearch.toLowerCase()) ||
          c.cadet_number.toLowerCase().includes(cadetSearch.toLowerCase())
      )
    : cadets;

  const goToStep2 = () => {
    setError(null);
    setStep(2);
    if (assignmentType === "flying") {
      loadMissions();
    } else {
      loadGrounds();
    }
  };

  const goToStep3 = () => {
    setCadetError(null);
    setStep(3);
    loadCadets();
  };

  const handleSaveAll = async () => {
    if (!instructor?.user?.id || !selectedCourseId || !selectedSemesterId) return;
    setLoadingSaveAll(true);
    setError(null);
    try {
      if (assignmentType === "flying") {
        const missionPayload = selectedMissionPhases.map(phase => ({
          mission_id: phase.id,
          exercise_ids: phase.allExercises
            .filter(ex => selectedKeys.has(makeKey(phase.id, ex.id)))
            .map(ex => ex.id),
          cadet_ids: Array.from(cadetAssignments.get(phase.id) ?? []),
        }));

        const is12Sqn = squadronType === "12sqn";
        if (is12Sqn) {
          await ftw12sqnInstructorAssignmentService.sync({
            instructor_id: instructor.user.id,
            course_id: selectedCourseId,
            semester_id: selectedSemesterId,
            missions: missionPayload,
          });
        } else {
          await ftw11sqnInstructorAssignmentService.sync({
            instructor_id: instructor.user.id,
            course_id: selectedCourseId,
            semester_id: selectedSemesterId,
            missions: missionPayload,
          });
        }
      } else {
        const groundPayload = selectedGroundGrounds.map(ground => ({
          ground_id: ground.id,
          exercise_ids: ground.allExercises
            .filter(ex => selectedGroundKeys.has(makeGroundKey(ground.id, ex.id)))
            .map(ex => ex.id),
          cadet_ids: Array.from(groundCadetAssignments.get(ground.id) ?? []),
        }));

        if (is12Sqn) {
          await ftw12sqnInstructorAssignGroundService.sync({
            instructor_id: instructor.user.id,
            course_id: selectedCourseId,
            semester_id: selectedSemesterId,
            grounds: groundPayload,
          });
        } else {
          await ftw11sqnInstructorAssignGroundService.sync({
            instructor_id: instructor.user.id,
            course_id: selectedCourseId,
            semester_id: selectedSemesterId,
            grounds: groundPayload,
          });
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

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleTypeChange = (newType: AssignmentType) => {
    setAssignmentType(newType);
    setStep(1);
    setSelectedKeys(new Set());
    setSelectedGroundKeys(new Set());
    setCadetAssignments(new Map());
    setGroundCadetAssignments(new Map());
  };

  const instructorActiveWing = instructorWings.find((w) => w.is_active);
  const totalCadetAssigned = assignmentType === "flying"
    ? Array.from(cadetAssignments.values()).reduce((s, set) => s + set.size, 0)
    : Array.from(groundCadetAssignments.values()).reduce((s, set) => s + set.size, 0);

  const currentSteps = assignmentType === "flying" ? STEPS_FLYING : STEPS_GROUND;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton className="max-w-2xl">
      <div className="p-6">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <FullLogo />
          </div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">
            Assign Mission/Ground &amp; Cadets
          </h2>
          <p className="text-sm text-gray-500">
            {instructor?.user?.name || "Instructor"} ({instructor?.user?.service_number || "N/A"})
          </p>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Icons.spinner className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {(instructorActiveWing || authSubWing) && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs">
                <Icons.hierarchy
                  className="w-4 h-4 text-blue-500 flex-shrink-0"
                />
                {instructorActiveWing && (
                  <span className="text-blue-700">
                    <span className="font-semibold">Instructor Wing:</span>{" "}
                    {instructorActiveWing.wing?.name ?? "—"}
                    {instructorActiveWing.sub_wing && (
                      <>
                        {" / "}
                        <span className="font-medium">{instructorActiveWing.sub_wing.name}</span>
                      </>
                    )}
                  </span>
                )}
                {authSubWing && (
                  <span className="text-gray-500 ml-2">
                    <span className="font-semibold">Your SubWing:</span>{" "}
                    <span className="font-medium">{authSubWing.name}</span>
                  </span>
                )}
              </div>
            )}

            {/* Assignment Type Toggle */}
            <div className="flex mb-4 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => handleTypeChange("flying")}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  assignmentType === "flying"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icons.flight className="w-4 h-4" />
                Flying Missions
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("ground")}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  assignmentType === "ground"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icons.book className="w-4 h-4" />
                Ground Exams
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center mb-5">
              {currentSteps.map((s, idx) => {
                const done = step > s.key;
                const cur  = step === s.key;
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${done ? "bg-green-500 text-white" : cur ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-100 text-gray-400"}`}>
                        {done
                          ? <Icons.checkmark className="w-4 h-4" />
                          : (() => {
                              const iconMap: Record<string, React.FC<{className?: string; style?: React.CSSProperties}>> = {
                                calendar: Icons.calendar,
                                flight: Icons.flight,
                                userGroup: Icons.userGroup,
                                checkCircle: Icons.checkCircle,
                                book: Icons.book,
                              };
                              const IconComponent = iconMap[s.icon] || Icons.calendar;
                              return <IconComponent className="w-4 h-4" />;
                            })()}
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

            {/* ── STEP 1: Course & Semester ── */}
            {step === 1 && (
              <div>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Course <span className="text-red-500">*</span></label>
                    <select
                      value={selectedCourseId ?? ""}
                      onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Semester <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={selectedSemesterId ?? ""}
                        onChange={(e) => setSelectedSemesterId(e.target.value ? Number(e.target.value) : null)}
                        disabled={!selectedCourseId || loadingSemesters}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">
                          {loadingSemesters ? "Loading..." : !selectedCourseId ? "Select course first" : "Select Semester"}
                        </option>
                        {semesters.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {loadingSemesters && (
                        <Icons.spinner className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-400 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Close</button>
                  <button
                    type="button"
                    onClick={goToStep2}
                    disabled={!selectedCourseId || !selectedSemesterId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    {assignmentType === "flying" ? "Next: Missions" : "Next: Grounds"}
                    <Icons.arrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Mission/Ground Selection ── */}
            {step === 2 && (
              <div>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}
                {assignmentType === "flying" ? (
                  loadingPhases ? (
                    <div className="flex items-center justify-center py-10">
                      <Icons.spinner className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Select Missions
                            </label>
                          </div>
                          {totalExercises > 0 && (
                            <button
                              type="button"
                              onClick={handleSelectAll}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {allSelected ? "Deselect All" : "Select All"}
                            </button>
                          )}
                        </div>

                        <div className="relative mb-3">
                <Icons.search
                  className="w-4 h-4 text-gray-400 pointer-events-none"
                />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search mission or exercise..."
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <Icons.cancel className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {filteredPhases.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            {searchQuery
                              ? `No results for "${searchQuery}"`
                              : "No missions found for this semester"}
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {filteredPhases.map((phase) => {
                              const isExpanded = expandedPhases.has(phase.id);
                              const fullySelected = isPhaseFullySelected(phase);
                              const partiallySelected = isPhasePartiallySelected(phase);
                              const phaseSelectedCount = phase.allExercises.filter((ex) =>
                                selectedKeys.has(makeKey(phase.id, ex.id))
                              ).length;

                              return (
                                <div
                                  key={phase.id}
                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                  <div 
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer"
                                    onClick={() => selectAllInPhase(phase)}
                                  >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${fullySelected ? 'bg-blue-600 border-blue-600 text-white' : partiallySelected ? 'bg-blue-100 border-blue-400 text-blue-600' : 'bg-white border-gray-300'}`}>
                                      {fullySelected ? (
                                        <Icons.checkmark className="w-3 h-3" />
                                      ) : partiallySelected ? (
                                        <div className="w-2 h-0.5 bg-blue-600 rounded-full" />
                                      ) : null}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-800">
                                        {phase.phase_symbol ? `[${phase.phase_symbol}] ` : ""}
                                        {phase.phase_full_name}
                                      </span>
                                      {phase.allExercises.length > 0 && (
                                        <span className="text-xs text-gray-400 ml-auto">
                                          {phaseSelectedCount}/{phase.allExercises.length}
                                        </span>
                                      )}
                                    </div>
                                    {selectionMode === "exercise" && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePhaseExpand(phase.id);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                                      >
                                        {isExpanded
                                          ? <Icons.arrowUp className="w-4 h-4" />
                                          : <Icons.arrowDown className="w-4 h-4" />}
                                      </button>
                                    )}
                                  </div>

                                  {selectionMode === "exercise" && isExpanded && (
                                    phase.allExercises.length === 0 ? (
                                      <p className="text-xs text-gray-400 px-4 py-2">
                                        No exercises in this mission
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-1 p-2 bg-white">
                                        {phase.allExercises.map((ex) => {
                                          const key = makeKey(phase.id, ex.id);
                                          const isSelected = selectedKeys.has(key);
                                          return (
                                            <div
                                              key={ex.id}
                                              onClick={() => toggleExercise(key)}
                                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                isSelected
                                                  ? "bg-blue-50 border border-blue-200"
                                                  : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                                              }`}
                                            >
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                                                {isSelected && <Icons.checkmark className="w-2.5 h-2.5" />}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-900 truncate">
                                                  {ex.exercise_shortname}
                                                </p>
                                                {ex.exercise_name !== ex.exercise_shortname && (
                                                  <p className="text-xs text-gray-400 truncate">
                                                    {ex.exercise_name}
                                                  </p>
                                                )}
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

                        {selectedKeys.size > 0 && (
                          <p className="mt-2 text-xs text-blue-600 font-medium">
                            {selectedKeys.size} exercise(s) selected across{" "}
                            {selectedMissionPhases.length} phase(s)
                          </p>
                        )}
                      </div>
                    </>
                  )
                ) : (
                  loadingGrounds ? (
                    <div className="flex items-center justify-center py-10">
                      <Icons.spinner className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Select Grounds
                            </label>
                          </div>
                          {totalGroundExercises > 0 && (
                            <button
                              type="button"
                              onClick={handleSelectAllGround}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {allGroundSelected ? "Deselect All" : "Select All"}
                            </button>
                          )}
                        </div>

                        <div className="relative mb-3">
                <Icons.search
                  className="w-4 h-4 text-gray-400 pointer-events-none"
                />
                          <input
                            type="text"
                            value={groundSearchQuery}
                            onChange={(e) => setGroundSearchQuery(e.target.value)}
                            placeholder="Search ground or exercise..."
                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {groundSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setGroundSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <Icons.cancel className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {filteredGrounds.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            {groundSearchQuery
                              ? `No results for "${groundSearchQuery}"`
                              : "No grounds found for this semester"}
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {filteredGrounds.map((ground) => {
                              const isExpanded = expandedGrounds.has(ground.id);
                              const fullySelected = isGroundFullySelected(ground);
                              const partiallySelected = isGroundPartiallySelected(ground);
                              const groundSelectedCount = ground.allExercises.filter((ex) =>
                                selectedGroundKeys.has(makeGroundKey(ground.id, ex.id))
                              ).length;

                              return (
                                <div
                                  key={ground.id}
                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                  <div 
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer"
                                    onClick={() => selectAllInGround(ground)}
                                  >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${fullySelected ? 'bg-blue-600 border-blue-600 text-white' : partiallySelected ? 'bg-blue-100 border-blue-400 text-blue-600' : 'bg-white border-gray-300'}`}>
                                      {fullySelected ? (
                                        <Icons.checkmark className="w-3 h-3" />
                                      ) : partiallySelected ? (
                                        <div className="w-2 h-0.5 bg-blue-600 rounded-full" />
                                      ) : null}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-800">
                                        {ground.ground_symbol ? `[${ground.ground_symbol}] ` : ""}
                                        {ground.ground_full_name}
                                      </span>
                                      {ground.allExercises.length > 0 && (
                                        <span className="text-xs text-gray-400 ml-auto">
                                          {groundSelectedCount}/{ground.allExercises.length}
                                        </span>
                                      )}
                                    </div>
                                    {selectionMode === "exercise" && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleGroundExpand(ground.id);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                                      >
                                        {isExpanded
                                          ? <Icons.arrowUp className="w-4 h-4" />
                                          : <Icons.arrowDown className="w-4 h-4" />}
                                      </button>
                                    )}
                                  </div>

                                  {selectionMode === "exercise" && isExpanded && (
                                    ground.allExercises.length === 0 ? (
                                      <p className="text-xs text-gray-400 px-4 py-2">
                                        No exercises in this ground
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-1 p-2 bg-white">
                                        {ground.allExercises.map((ex) => {
                                          const key = makeGroundKey(ground.id, ex.id);
                                          const isSelected = selectedGroundKeys.has(key);
                                          return (
                                            <div
                                              key={ex.id}
                                              onClick={() => toggleGroundExercise(key)}
                                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                                isSelected
                                                  ? "bg-blue-50 border border-blue-200"
                                                  : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                                              }`}
                                            >
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'}`}>
                                                {isSelected && <Icons.checkmark className="w-2.5 h-2.5" />}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-900 truncate">
                                                  {ex.exercise_shortname}
                                                </p>
                                                {ex.exercise_name !== ex.exercise_shortname && (
                                                  <p className="text-xs text-gray-400 truncate">
                                                    {ex.exercise_name}
                                                  </p>
                                                )}
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

                        {selectedGroundKeys.size > 0 && (
                          <p className="mt-2 text-xs text-blue-600 font-medium">
                            {selectedGroundKeys.size} exercise(s) selected across{" "}
                            {selectedGroundGrounds.length} ground(s)
                          </p>
                        )}
                      </div>
                    </>
                  )
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                  >
                    <Icons.arrowLeft className="w-4 h-4" />
                    Back to Course
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (assignmentType === "flying" && selectedMissionPhases.length > 0) goToStep3();
                        else if (assignmentType === "ground" && selectedGroundGrounds.length > 0) goToStep3();
                      }}
                      disabled={assignmentType === "flying" ? selectedMissionPhases.length === 0 : selectedGroundGrounds.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      Next: Assign Cadets
                      <Icons.arrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Cadet Assignment ── */}
            {step === 3 && (
              <div>
                {cadetError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {cadetError}
                  </div>
                )}

                {loadingCadets ? (
                  <div className="flex items-center justify-center py-10">
                    <Icons.spinner
                      className="w-8 h-8 animate-spin text-blue-500"
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <Icons.search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={cadetSearch}
                        onChange={(e) => setCadetSearch(e.target.value)}
                        placeholder="Search cadet by name or number..."
                        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {cadetSearch && (
                        <button
                          type="button"
                          onClick={() => setCadetSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <Icons.cancel className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {cadets.length === 0 ? (
                      <p className="text-sm text-gray-500 py-6 text-center">
                        No cadets found for this semester
                      </p>
                    ) : assignmentType === "flying" ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {selectedMissionPhases.map((phase) => {
                          const missionCadets =
                            cadetAssignments.get(phase.id) ?? new Set<number>();
                          const isExpanded = expandedCadetPhases.has(phase.id);
                          const filteredIds = filteredCadets.map((c) => c.id);
                          const allCadetsIn =
                            filteredCadets.length > 0 &&
                            filteredCadets.every((c) => missionCadets.has(c.id));

                          return (
                            <div
                              key={phase.id}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => toggleCadetPhaseExpand(phase.id)}
                                  className="flex-1 flex items-center gap-2 text-left"
                                >
                                  {isExpanded
                                    ? <Icons.arrowUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    : <Icons.arrowDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                  <span className="text-sm font-semibold text-gray-800">
                                    {phase.phase_symbol ? `[${phase.phase_symbol}] ` : ""}
                                    {phase.phase_full_name}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-auto">
                                    {missionCadets.size} assigned
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    selectAllCadetsForMission(phase.id, filteredIds)
                                  }
                                  className="text-xs text-blue-600 hover:text-blue-700 flex-shrink-0"
                                >
                                  {allCadetsIn ? "Deselect All" : "Select All"}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="grid grid-cols-2 gap-1 p-2 bg-white">
                                  {filteredCadets.map((cadet) => {
                                    const isAssigned = missionCadets.has(cadet.id);
                                    return (
                                      <div
                                        key={cadet.id}
                                        onClick={() =>
                                          toggleCadetForMission(phase.id, cadet.id)
                                        }
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                          isAssigned
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isAssigned ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300'}`}>
                                          {isAssigned && <Icons.checkmark className="w-2.5 h-2.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">
                                            {cadet.name}
                                          </p>
                                          <p className="text-xs text-gray-400 truncate">
                                            {cadet.cadet_number}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {selectedGroundGrounds.map((ground) => {
                          const groundCadets =
                            groundCadetAssignments.get(ground.id) ?? new Set<number>();
                          const isExpanded = expandedCadetGrounds.has(ground.id);
                          const filteredIds = filteredCadets.map((c) => c.id);
                          const allCadetsIn =
                            filteredCadets.length > 0 &&
                            filteredCadets.every((c) => groundCadets.has(c.id));

                          return (
                            <div
                              key={ground.id}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => toggleCadetGroundExpand(ground.id)}
                                  className="flex-1 flex items-center gap-2 text-left"
                                >
                                  {isExpanded
                                    ? <Icons.arrowUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    : <Icons.arrowDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                  <span className="text-sm font-semibold text-gray-800">
                                    {ground.ground_symbol ? `[${ground.ground_symbol}] ` : ""}
                                    {ground.ground_full_name}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-auto">
                                    {groundCadets.size} assigned
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    selectAllCadetsForGround(ground.id, filteredIds)
                                  }
                                  className="text-xs text-blue-600 hover:text-blue-700 flex-shrink-0"
                                >
                                  {allCadetsIn ? "Deselect All" : "Select All"}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="grid grid-cols-2 gap-1 p-2 bg-white">
                                  {filteredCadets.map((cadet) => {
                                    const isAssigned = groundCadets.has(cadet.id);
                                    return (
                                      <div
                                        key={cadet.id}
                                        onClick={() =>
                                          toggleCadetForGround(ground.id, cadet.id)
                                        }
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                          isAssigned
                                            ? "bg-green-50 border border-green-200"
                                            : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isAssigned ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300'}`}>
                                          {isAssigned && <Icons.checkmark className="w-2.5 h-2.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">
                                            {cadet.name}
                                          </p>
                                          <p className="text-xs text-gray-400 truncate">
                                            {cadet.cadet_number}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {totalCadetAssigned > 0 && (
                      <p className="mt-2 text-xs text-green-600 font-medium">
                        {totalCadetAssigned} cadet-{assignmentType === "flying" ? "mission" : "ground"} assignment(s)
                      </p>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                  >
                    <Icons.arrowLeft className="w-4 h-4" />
                    Back to {assignmentType === "flying" ? "Missions" : "Grounds"}
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      Next: Review
                      <Icons.arrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* ── STEP 4: Review & Final Save ── */}
            {step === 4 && (
              <div>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Assignment Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Course & Semester</p>
                      <p className="text-sm font-medium text-gray-900">
                        {courses.find(c => c.id === selectedCourseId)?.name || "—"} / {semesters.find(s => s.id === selectedSemesterId)?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Instructor</p>
                      <p className="text-sm font-medium text-gray-900">
                        {instructor?.user?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Type</p>
                      <p className="text-sm font-medium text-gray-900">
                        {assignmentType === "flying" ? "Flying Missions" : "Ground Exams"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                        {assignmentType === "flying" ? "Missions" : "Grounds"} Selected
                      </p>
                      <div className="flex items-center gap-2">
                        {assignmentType === "flying" ? <Icons.flight className="w-5 h-5 text-blue-500" /> : <Icons.book className="w-5 h-5 text-blue-500" />}
                        <span className="text-lg font-bold text-gray-900">
                          {assignmentType === "flying" ? selectedKeys.size : selectedGroundKeys.size}
                        </span>
                        <span className="text-xs text-gray-400">
                          exercises in {assignmentType === "flying" ? selectedMissionPhases.length : selectedGroundGrounds.length} 
                          {assignmentType === "flying" ? " phases" : " grounds"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">Cadets Assigned</p>
                      <div className="flex items-center gap-2">
                        <Icons.userGroup className="w-5 h-5 text-green-500" />
                        <span className="text-lg font-bold text-gray-900">{totalCadetAssigned}</span>
                        <span className="text-xs text-gray-400">assignments</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2">
                      Selected {assignmentType === "flying" ? "Phases" : "Grounds"}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(assignmentType === "flying" ? selectedMissionPhases : selectedGroundGrounds).map((item: any) => (
                        <span key={item.id} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 uppercase">
                          <Icons.checkCircle className="w-3 h-3" />
                          {item.phase_symbol || item.ground_symbol || item.phase_shortname || item.ground_shortname}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={loadingSaveAll}
                    className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Icons.arrowLeft className="w-4 h-4" />
                    Back to Cadets
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loadingSaveAll}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={loadingSaveAll}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
                    >
                      {loadingSaveAll ? (
                        <>
                          <Icons.spinner className="w-4 h-4 animate-spin" />
                          Saving Everything...
                        </>
                      ) : (
                        <>
                          <Icons.checkCircle className="w-4 h-4" />
                          Save Everything
                        </>
                      )}
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