"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ResultSubmission } from "@/libs/types/approval";

interface ResultSubmissionModalContextType {
  isOpen: boolean;
  editingSubmission: ResultSubmission | null;
  viewMode: 'create' | 'view' | 'review';
  openModal: (submission?: ResultSubmission, mode?: 'create' | 'view' | 'review') => void;
  closeModal: () => void;
}

const ResultSubmissionModalContext = createContext<ResultSubmissionModalContextType | undefined>(undefined);

export function ResultSubmissionModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<ResultSubmission | null>(null);
  const [viewMode, setViewMode] = useState<'create' | 'view' | 'review'>('create');

  const openModal = (submission?: ResultSubmission, mode: 'create' | 'view' | 'review' = 'create') => {
    setEditingSubmission(submission || null);
    setViewMode(mode);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setEditingSubmission(null);
      setViewMode('create');
    }, 300);
  };

  return (
    <ResultSubmissionModalContext.Provider value={{ isOpen, editingSubmission, viewMode, openModal, closeModal }}>
      {children}
    </ResultSubmissionModalContext.Provider>
  );
}

export function useResultSubmissionModal() {
  const context = useContext(ResultSubmissionModalContext);
  if (!context) {
    throw new Error("useResultSubmissionModal must be used within ResultSubmissionModalProvider");
  }
  return context;
}
