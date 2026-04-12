"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface SemesterData {
  semester_details: {
    id: number;
    name: string;
    code: string | null;
    total_examinations: number;
    total_cadets: number;
  };
  course_details: {
    id: number;
    name: string;
    code: string | null;
  };
  cadets: CadetData[];
}

interface CadetData {
  cadet_details: {
    id: number;
    name: string;
    bdno: string;
    rank?: { id: number; name: string };
    course_id: number;
    semester_id: number;
    total_examinations: number;
    average_mark: number;
  };
  marks: any[];
}

interface ProgressData {
  cadet_id: number;
  bd_no: string;
  name: string;
  rank: string;
  sorties_required: number;
  sorties_complete: number;
  sorties_left: number;
  flying_days_available: number;
  sorties_required_per_day: number;
  sorties_required_per_day_with_bad_weather: number;
  progress_percent: number;
}

interface MonthlyData {
  month: string;
  all_working_days: number;
  with_02_saturday: number;
  with_all_saturday: number;
}

interface ProgressReportTabProps {
  reportData: {
    progress?: ProgressData[];
    semester_details?: any;
    course_details?: any;
    start_date?: string;
  };
  semesterData: SemesterData | null;
  semesterId: number;
  courseId: number;
}

const ProgressReportTab: React.FC<ProgressReportTabProps> = ({
  reportData,
  semesterData,
  semesterId,
  courseId,
}) => {
  const progressData = reportData?.progress || [];

  // Calculate monthly data from first mission date to today
  const calculateMonthlyData = (): MonthlyData[] => {
    const months = [];
    const today = new Date();
    // Use start_date from reportData or default to semester start
    const startDateStr = reportData?.start_date || '2026-01-01';
    const startDate = new Date(startDateStr);
    
    // Generate months from start date to today
    const currentMonth = new Date(startDate);
    while (currentMonth <= today) {
      const monthName = currentMonth.toLocaleString('default', { month: 'short' });
      const year = currentMonth.getFullYear().toString().slice(-2);
      const monthKey = `${monthName} ${year}`;
      
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
      
      // Calculate working days (Mon-Fri)
      let allWorkingDays = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday(0) or Saturday(6)
          allWorkingDays++;
        }
      }
      
      // With 02 Saturdays (assume 2 Saturdays are flying days)
      const totalSaturdays = Array.from({length: daysInMonth}, (_, i) => {
        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
        return d.getDay();
      }).filter(d => d === 6).length;
      const with02Saturday = allWorkingDays + Math.min(2, totalSaturdays);
      
      // With all Saturdays
      const withAllSaturday = allWorkingDays + totalSaturdays;
      
      months.push({
        month: monthKey,
        all_working_days: allWorkingDays,
        with_02_saturday: with02Saturday,
        with_all_saturday: withAllSaturday,
      });
      
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return months;
  };

  const monthlyData = calculateMonthlyData();

  return (
    <div className="bg-white overflow-hidden space-y-6">
      {/* Sortie Progress Table */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 uppercase">
            Progress Report - 11SQN BAF
          </h2>
          <p className="text-sm text-gray-600">
            Semester: {reportData?.semester_details?.semester_id || semesterId} | Course: {reportData?.course_details?.course_id || courseId}
          </p>
        </div>

        {progressData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon icon="hugeicons:information-circle" className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No progress data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">SL</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Rank</th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold">Name</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Sorties Required</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Sorties Complete</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Sorties Left</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Flg Days Avail</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Sorties Req/Day</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Sorties Req/Day (20% Bad Wx)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Progress % till dt</th>
                </tr>
              </thead>
              <tbody>
                {progressData.map((cadet, index) => (
                  <tr key={cadet.cadet_id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{cadet.rank}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left">{cadet.name}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{cadet.sorties_required}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{cadet.sorties_complete}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{cadet.sorties_left}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{cadet.flying_days_available}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{cadet.sorties_required_per_day}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{cadet.sorties_required_per_day_with_bad_weather}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, cadet.progress_percent)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{cadet.progress_percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Course Planned Table */}
      <div>
        <div className="text-center mb-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase">
            Course Planned (From First Mission Date to Today)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Particulars</th>
                {monthlyData.map((month) => (
                  <th key={month.month} className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">
                    {month.month}
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-left text-xs font-medium">All WK Days</td>
                {monthlyData.map((month) => (
                  <td key={month.month} className="border border-gray-300 px-2 py-2 text-center text-xs">
                    {month.all_working_days}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">
                  {monthlyData.reduce((sum, m) => sum + m.all_working_days, 0)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-2 py-2 text-left text-xs font-medium">With 02 Saturday</td>
                {monthlyData.map((month) => (
                  <td key={month.month} className="border border-gray-300 px-2 py-2 text-center text-xs">
                    {month.with_02_saturday}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">
                  {monthlyData.reduce((sum, m) => sum + m.with_02_saturday, 0)}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-2 py-2 text-left text-xs font-medium">With All Saturday</td>
                {monthlyData.map((month) => (
                  <td key={month.month} className="border border-gray-300 px-2 py-2 text-center text-xs">
                    {month.with_all_saturday}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-2 text-center text-xs font-medium">
                  {monthlyData.reduce((sum, m) => sum + m.with_all_saturday, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Description Table */}
      <div>
        <div className="text-center mb-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase">
            Course Progress Description
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-xs font-semibold">Days</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-xs font-semibold">Sorties per Day</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 text-left text-xs">Total Wk Days Left</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                  {Math.max(0, 180 - monthlyData.reduce((sum, m) => sum + m.all_working_days, 0))}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                  {progressData.length > 0 ? progressData[0].sorties_required_per_day : 0}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-left text-xs">Wk Days Left Considering 20% Bad Weather</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                  {Math.max(0, Math.round((180 - monthlyData.reduce((sum, m) => sum + m.all_working_days, 0)) * 0.8))}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                  {progressData.length > 0 ? progressData[0].sorties_required_per_day_with_bad_weather : 0}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 text-left text-xs">Wk Days Left with 02 Saturdays/Month</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                  {Math.max(0, 180 - monthlyData.reduce((sum, m) => sum + m.with_02_saturday, 0))}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">-</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-left text-xs">Wk Days with All Saturday</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                  {monthlyData.reduce((sum, m) => sum + m.with_all_saturday, 0)}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">-</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2 text-left text-xs">Wk Days Left with All Saturday incl 20% Bad Wx</td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                  {Math.max(0, Math.round((180 - monthlyData.reduce((sum, m) => sum + m.with_all_saturday, 0)) * 0.8))}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center text-xs">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgressReportTab;