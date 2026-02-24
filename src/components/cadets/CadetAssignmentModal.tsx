/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { cadetAssignmentService } from "@/libs/services/cadetAssignmentService";
import { useCadetAssignmentModal } from "@/context/CadetAssignmentModalContext";
import FullLogo from "@/components/ui/fulllogo";
import apiClient from "@/libs/auth/api-client";
import { getToken } from "@/libs/auth/auth-token";
import { Icon } from "@iconify/react";

interface Assignment {
  type: 'rank' | 'course' | 'semester' | 'wing' | 'subwing' | 'program' | 'group';
  entityId: string;
  startDate: string;
  endDate: string;
  description: string;
}

export default function CadetAssignmentModal() {
  const { isOpen, cadet, closeModal } = useCadetAssignmentModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'rank' | 'course' | 'semester' | 'wing' | 'subwing' | 'program' | 'group'>('rank');

  // Options data
  const [ranks, setRanks] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [wings, setWings] = useState<any[]>([]);
  const [subWings, setSubWings] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<Assignment>({
    type: 'rank',
    entityId: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      setFormData({
        type: activeTab,
        entityId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
      });
      setError("");
    }
  }, [isOpen, activeTab]);

  const loadAllData = async () => {
    try {
      const token = getToken();

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const [ranksRes, coursesRes, semestersRes, wingsRes, subWingsRes, programsRes, groupsRes] = await Promise.all([
        apiClient.get('/ranks', token),
        apiClient.get('/system-courses', token),
        apiClient.get('/system-semesters', token),
        apiClient.get('/wings', token),
        apiClient.get('/sub-wings', token),
        apiClient.get('/system-programs', token),
        apiClient.get('/system-groups', token),
      ]);

      setRanks(ranksRes.data || []);
      setCourses(coursesRes.data || []);
      setSemesters(semestersRes.data || []);
      setWings(wingsRes.data || []);
      setSubWings(subWingsRes.data || []);
      setPrograms(programsRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (error: any) {
      console.error('Failed to load assignment options:', error);
      if (error.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(error.message || 'Failed to load options. Please try again.');
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cadet || !formData.entityId) {
      setError('Please select an option');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = {
        cadet_id: cadet.id,
        start_date: formData.startDate,
        end_date: formData.endDate || undefined,
        description: formData.description || undefined,
      };

      switch (formData.type) {
        case 'rank':
          await cadetAssignmentService.assignRank({ ...data, rank_id: Number(formData.entityId) });
          break;
        case 'course':
          await cadetAssignmentService.assignCourse({ ...data, course_id: Number(formData.entityId) });
          break;
        case 'semester':
          await cadetAssignmentService.assignSemester({ ...data, semester_id: Number(formData.entityId) });
          break;
        case 'wing':
          await cadetAssignmentService.assignWing({ ...data, wing_id: Number(formData.entityId) });
          break;
        case 'subwing':
          await cadetAssignmentService.assignSubWing({ ...data, sub_wing_id: Number(formData.entityId) });
          break;
        case 'program':
          await cadetAssignmentService.assignProgram({ ...data, program_id: Number(formData.entityId) });
          break;
        case 'group':
          await cadetAssignmentService.assignGroup({ ...data, group_id: Number(formData.entityId) });
          break;
      }

      closeModal();
      // Trigger a custom event to reload cadet list
      window.dispatchEvent(new CustomEvent('cadetAssignmentUpdated'));
    } catch (err: any) {
      console.error('Failed to assign:', err);
      if (err.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err.message || 'Failed to assign. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'rank' as const, label: 'Rank', icon: 'hugeicons:medal-01' },
    { key: 'course' as const, label: 'Course', icon: 'hugeicons:book-02' },
    { key: 'semester' as const, label: 'Semester', icon: 'hugeicons:calendar-03' },
    { key: 'wing' as const, label: 'Wing', icon: 'hugeicons:building-03' },
    { key: 'subwing' as const, label: 'Sub-Wing', icon: 'hugeicons:building-04' },
    { key: 'program' as const, label: 'Program', icon: 'hugeicons:certificate-01' },
    { key: 'group' as const, label: 'Group', icon: 'hugeicons:user-group' },
  ];

  const getOptions = () => {
    switch (activeTab) {
      case 'rank': return ranks;
      case 'course': return courses;
      case 'semester': return semesters;
      case 'wing': return wings;
      case 'subwing': return subWings;
      case 'program': return programs;
      case 'group': return groups;
      default: return [];
    }
  };

  const getOptionLabel = (option: any) => {
    if (activeTab === 'rank') return `${option.short_name} - ${option.name}`;
    return option.name || option.title;
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} showCloseButton={true} className="max-w-3xl p-0">
      <form onSubmit={handleSubmit} className="p-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6">
          <div>
            <FullLogo />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assign to Cadet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cadet ? `${cadet.name} (${cadet.cadet_number})` : 'Select assignment type and details'}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setFormData({ ...formData, type: tab.key, entityId: '' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon icon={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Entity Selection */}
          <div>
            <Label>
              Select {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} <span className="text-red-500">*</span>
            </Label>
            <select
              value={formData.entityId}
              onChange={(e) => handleChange("entityId", e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose {activeTab}...</option>
              {getOptions().map((option) => (
                <option key={option.id} value={option.id}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description / Notes</Label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-black dark:text-white rounded-xl"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-xl"
            disabled={loading}
          >
            {loading ? "Assigning..." : `Assign ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
