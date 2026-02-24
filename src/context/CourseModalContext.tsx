"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SystemCourse } from "@/libs/types/system";

interface CourseModalContextType {
  isOpen: boolean;
  editingCourse: SystemCourse | null;
  openModal: (course?: SystemCourse) => void;
  closeModal: () => void;
}

const CourseModalContext = createContext<CourseModalContextType | undefined>(undefined);

export function CourseModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<SystemCourse | null>(null);

  const openModal = (course?: SystemCourse) => {
    setEditingCourse(course || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setEditingCourse(null), 300);
  };

  return (
    <CourseModalContext.Provider value={{ isOpen, editingCourse, openModal, closeModal }}>
      {children}
    </CourseModalContext.Provider>
  );
}

export function useCourseModal() {
  const context = useContext(CourseModalContext);
  if (context === undefined) {
    throw new Error("useCourseModal must be used within a CourseModalProvider");
  }
  return context;
}
