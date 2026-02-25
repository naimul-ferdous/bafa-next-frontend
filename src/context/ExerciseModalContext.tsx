"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Ftw11sqnFlyingSyllabusExercise } from "@/libs/types/ftw11sqnFlying";

interface ExerciseModalContextType {
  isOpen: boolean;
  editingExercise: Ftw11sqnFlyingSyllabusExercise | null;
  initialPhaseTypeId: number | null;
  syllabusId: number | null;
  openModal: (exercise?: Ftw11sqnFlyingSyllabusExercise, phaseTypeId?: number, syllabusId?: number) => void;
  closeModal: () => void;
}

const ExerciseModalContext = createContext<ExerciseModalContextType | undefined>(undefined);

export function ExerciseModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Ftw11sqnFlyingSyllabusExercise | null>(null);
  const [initialPhaseTypeId, setInitialPhaseTypeId] = useState<number | null>(null);
  const [syllabusId, setSyllabusId] = useState<number | null>(null);

  const openModal = (exercise?: Ftw11sqnFlyingSyllabusExercise, phaseTypeId?: number, syllId?: number) => {
    setEditingExercise(exercise || null);
    setInitialPhaseTypeId(phaseTypeId || null);
    setSyllabusId(syllId || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setEditingExercise(null);
      setInitialPhaseTypeId(null);
      setSyllabusId(null);
    }, 300);
  };

  return (
    <ExerciseModalContext.Provider value={{ isOpen, editingExercise, initialPhaseTypeId, syllabusId, openModal, closeModal }}>
      {children}
    </ExerciseModalContext.Provider>
  );
}

export function useExerciseModal() {
  const context = useContext(ExerciseModalContext);
  if (context === undefined) {
    throw new Error("useExerciseModal must be used within an ExerciseModalProvider");
  }
  return context;
}
