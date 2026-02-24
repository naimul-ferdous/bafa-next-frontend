"use client";

import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface CadetData {
  cadet_details: {
    id: number;
    name: string;
    bdno: string;
  };
  phases: any[];
}

interface GraphTabProps {
  cadetData: CadetData;
}

const GraphTab: React.FC<GraphTabProps> = ({ cadetData }) => {
  const [activeFlightTab, setActiveFlightTab] = useState<"dual" | "solo">("dual");

  const chartData = useMemo(() => {
    if (!cadetData?.phases) return null;

    const sortedPhases =
      cadetData.phases?.sort(
        (a, b) => (a.phase_details?.phase_sort || 0) - (b.phase_details?.phase_sort || 0)
      ) || [];

    const allMissions =
      sortedPhases.flatMap((phase) =>
        phase.exercises.map((exercise: any) => ({
          ...exercise,
          phase_details: phase.phase_details,
        }))
      ) || [];

    // Filter missions for flights with time
    const flightMissions = allMissions.filter(
      (mission) =>
        mission.achieved_time !== null &&
        !isNaN(parseFloat(mission.achieved_time || "0")) &&
        parseFloat(mission.achieved_time || "0") > 0
    );

    // Get unique exercises
    const exercisesMap = new Map();
    flightMissions.forEach((mission) => {
      const exerciseKey = `${mission.ftw_11sqn_flying_syllabus_exercise_id}-${mission.exercise?.exercise_name}`;
      if (!exercisesMap.has(exerciseKey)) {
        exercisesMap.set(exerciseKey, {
          id: mission.ftw_11sqn_flying_syllabus_exercise_id,
          name: mission.exercise?.exercise_name,
          shortName: mission.exercise?.exercise_name?.substring(0, 10),
          phase: mission.phase_details?.phase_shortname,
          phaseSort: mission.phase_details?.phase_sort,
          key: exerciseKey,
          mission: mission,
        });
      }
    });

    // Sort exercises by phase_sort
    const sortedExercises = Array.from(exercisesMap.values()).sort((a, b) => {
      if (a.phaseSort !== b.phaseSort) {
        return a.phaseSort - b.phaseSort;
      }
      return a.id - b.id;
    });

    // Line Chart Data for Mission Performance
    const lineChartCategories = sortedExercises.map((ex) => ex.shortName || ex.name);
    const lineChartData = sortedExercises.map((exercise) => {
      const parsedMark = parseFloat(exercise.mission.achieved_mark);
      return isNaN(parsedMark) ? 0 : parsedMark;
    });

    const lineChartOptions: ApexOptions = {
      legend: {
        show: false,
        position: "top",
        horizontalAlign: "left",
      },
      colors: [activeFlightTab === "dual" ? "#3B82F6" : "#22C55E"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        height: 350,
        type: "area",
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
        },
      },
      markers: {
        size: 4,
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
      grid: {
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val.toFixed(2)}%`,
        },
      },
      xaxis: {
        type: "category",
        categories: lineChartCategories,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          rotate: -45,
          style: {
            fontSize: "10px",
          },
        },
        title: {
          text: "Exercises",
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
          formatter: (val: number) => `${val}%`,
        },
        title: {
          text: "Mission Marks (%)",
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
      },
    };

    const lineChartSeries = [
      {
        name: `${cadetData.cadet_details.name} (${activeFlightTab === "dual" ? "Dual" : "Solo"} Flight)`,
        data: lineChartData,
      },
    ];

    // Phase Performance Bar Chart Data
    const phaseMarksStats: {
      [key: string]: {
        phaseName: string;
        phaseFullName: string;
        phaseSort: number;
        allMarks: number[];
        totalExercises: number;
      };
    } = {};

    sortedPhases.forEach((phase) => {
      const phaseSymbol = phase.phase_details?.phase_symbol || phase.phase_details?.phase_shortname;
      if (!phaseSymbol) return;

      if (!phaseMarksStats[phaseSymbol]) {
        phaseMarksStats[phaseSymbol] = {
          phaseName: phase.phase_details?.phase_shortname,
          phaseFullName: phase.phase_details?.phase_fullname,
          phaseSort: phase.phase_details?.phase_sort || 0,
          allMarks: [],
          totalExercises: 0,
        };
      }

      if (Array.isArray(phase.exercises)) {
        phase.exercises.forEach((exercise: any) => {
          const mark = parseFloat(exercise.achieved_mark?.toString() || "0");
          if (!isNaN(mark) && mark > 0) {
            phaseMarksStats[phaseSymbol].allMarks.push(mark);
          }
        });
        phaseMarksStats[phaseSymbol].totalExercises += phase.exercises.length;
      }
    });

    const sortedPhaseData = Object.values(phaseMarksStats).sort((a, b) => a.phaseSort - b.phaseSort);

    const barChartCategories = sortedPhaseData.map((phase) => phase.phaseName);
    const barChartData = sortedPhaseData.map((phase) => {
      if (phase.allMarks.length === 0) return 0;
      return Number((phase.allMarks.reduce((sum, m) => sum + m, 0) / phase.allMarks.length).toFixed(2));
    });

    // Generate colors based on average
    const barColors = barChartData.map((avg) => {
      if (avg >= 80) return "#22C55E"; // green
      if (avg >= 60) return "#EAB308"; // yellow
      return "#EF4444"; // red
    });

    const barChartOptions: ApexOptions = {
      colors: barColors,
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        height: 300,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "50%",
          borderRadius: 5,
          borderRadiusApplication: "end",
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}%`,
        style: {
          fontSize: "11px",
          fontWeight: 600,
        },
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: barChartCategories,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        title: {
          text: "Phases",
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
      },
      legend: {
        show: false,
      },
      yaxis: {
        min: 0,
        max: 100,
        title: {
          text: "Average Mark (%)",
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (val: number) => `${val}%`,
        },
      },
      grid: {
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val}%`,
        },
      },
    };

    const barChartSeries = [
      {
        name: "Phase Average",
        data: barChartData,
      },
    ];

    // Calculate statistics
    const totalMissions = allMissions.length;
    const flightCount = flightMissions.length;

    const averageMark =
      allMissions.length > 0
        ? allMissions.reduce((sum, mission) => {
            const mark = parseFloat(mission.achieved_mark);
            return sum + (isNaN(mark) ? 0 : mark);
          }, 0) / allMissions.length
        : 0;

    // Calculate total flight hours
    const totalFlightHours = allMissions.reduce((sum, mission) => {
      const time = parseFloat(mission.achieved_time || "0");
      return sum + (isNaN(time) ? 0 : time);
    }, 0);

    return {
      lineChartOptions,
      lineChartSeries,
      barChartOptions,
      barChartSeries,
      totalMissions,
      flightCount,
      averageMark,
      totalFlightHours,
    };
  }, [cadetData, activeFlightTab]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available for charts</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Mission Performance Trend Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Mission Performance Trend</h3>
          <div className="flex items-center space-x-3">
            <nav className="bg-gray-100 p-1 flex rounded-full">
              <button
                onClick={() => setActiveFlightTab("dual")}
                className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${
                  activeFlightTab === "dual"
                    ? "bg-blue-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon icon="hugeicons:user-group" className="w-4 h-4" />
                  <span>Dual</span>
                </div>
              </button>
              <button
                onClick={() => setActiveFlightTab("solo")}
                className={`py-1 px-4 font-medium text-sm rounded-full transition-colors ${
                  activeFlightTab === "solo"
                    ? "bg-green-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon icon="hugeicons:user" className="w-4 h-4" />
                  <span>Solo</span>
                </div>
              </button>
            </nav>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]">
            <ReactApexChart
              options={chartData.lineChartOptions}
              series={chartData.lineChartSeries}
              type="area"
              height={350}
            />
          </div>
        </div>
      </div>

      {/* Phase Performance Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Phase Performance Analysis</h3>
          <Icon icon="hugeicons:chart-bar-line" className="w-5 h-5 text-gray-600" />
        </div>
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[600px]">
            <ReactApexChart
              options={chartData.barChartOptions}
              series={chartData.barChartSeries}
              type="bar"
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphTab;
