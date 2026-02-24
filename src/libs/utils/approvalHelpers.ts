/**
 * Common approval utility functions for Flying Examination modules
 * Used by both 11 Squadron and 12 Squadron
 */

export interface ApprovalProcess {
  id: number;
  status_code: string;
  role_id: number;
  role?: {
    id: number;
    name: string;
  };
  description?: string;
  status: string;
}

export interface CadetApprovalStatus {
  id: number;
  cadet_id: number;
  course_id: number;
  semester_id: number;
  progress_id: number;
  send_progress_id?: number;
  next_progress_id?: number;
  approval_status: "pending" | "approved" | "rejected";
  remark?: string;
  approved_by?: number;
  approved_at?: string;
  created_at?: string;
  approver?: {
    id: number;
    name: string;
  };
}

/**
 * Check if current user can approve a specific cadet
 */
export const canApproveThisCadet = (
  cadetId: number,
  cadetApprovalStatuses: CadetApprovalStatus[],
  approvalProcesses: ApprovalProcess[],
  courseId: number,
  semesterId: number,
  profileRoleId?: number
): boolean => {
  if (!profileRoleId) {
    return false;
  }

  // Find all approval statuses for this cadet
  const cadetApprovals = cadetApprovalStatuses.filter(
    (status) =>
      status.cadet_id === cadetId &&
      status.course_id === courseId &&
      status.semester_id === semesterId
  );

  // If no approval record exists, check if user's role is in approval process
  if (cadetApprovals.length === 0) {
    const userProcess = approvalProcesses.find(
      (p) => p.role_id === profileRoleId
    );
    return !!userProcess;
  }

  // Sort approvals by ID (chronologically, highest ID = most recent)
  const sortedApprovals = [...cadetApprovals].sort((a, b) => b.id - a.id);

  // Get the latest approval (most recent by ID)
  const latestApproval = sortedApprovals[0];

  // Check if the latest approval is rejected - if so, don't allow further approvals
  if (latestApproval.approval_status === "rejected") {
    return false;
  }

  // If latest approval is approved, check the next_progress_id
  if (latestApproval.approval_status === "approved") {
    // Check if there's a next_progress_id that matches user's role
    if (latestApproval.next_progress_id) {
      const nextProcess = approvalProcesses.find(
        (p) => p.id === latestApproval.next_progress_id
      );
      return nextProcess?.role_id === profileRoleId;
    }
    // No next level - all approvals complete
    return false;
  }

  // No approved approvals yet - check if user is first in the process
  const firstProcess = approvalProcesses.find((p) => p.status_code === "0");
  if (firstProcess?.role_id === profileRoleId) {
    return true;
  }

  return false;
};

/**
 * Check if cadet is already approved by the current user
 */
export const isAlreadyApprovedByMe = (
  cadetId: number,
  cadetApprovalStatuses: CadetApprovalStatus[],
  approvalProcesses: ApprovalProcess[],
  courseId: number,
  semesterId: number,
  profileId?: number,
  profileRoleId?: number
): boolean => {
  if (!profileId || !profileRoleId) return false;

  // Find current user's approval process
  const userProcess = approvalProcesses.find((p) => p.role_id === profileRoleId);
  if (!userProcess) return false;

  // Find ALL approval statuses for this cadet at current user's progress level
  const cadetApprovalsAtMyLevel = cadetApprovalStatuses.filter(
    (status) =>
      status.cadet_id === cadetId &&
      status.course_id === courseId &&
      status.semester_id === semesterId &&
      status.progress_id === userProcess.id
  );

  if (cadetApprovalsAtMyLevel.length === 0) return false;

  // Get the latest approval at this level (highest ID)
  const latestApprovalAtMyLevel = cadetApprovalsAtMyLevel.reduce(
    (latest, current) => {
      return !latest || current.id > latest.id ? current : latest;
    },
    null as CadetApprovalStatus | null
  );

  // Check if the latest approval at this level is 'approved'
  return latestApprovalAtMyLevel?.approval_status === "approved";
};

export interface ApprovalStatusItem {
  roleName: string;
  text: string;
  timestamp: string | null;
  color: string;
  icon: string;
  isResubmission: boolean;
  remark: string | null;
  nextProgressId: number | null;
  processId: number;
  isPending: boolean;
  isCurrentStage?: boolean;
}

/**
 * Get approval status list for a specific cadet
 */
export const getCadetApprovalStatusList = (
  cadetId: number,
  cadetApprovalStatuses: CadetApprovalStatus[],
  approvalProcesses: ApprovalProcess[],
  courseId: number,
  semesterId: number,
  profileId?: number
): ApprovalStatusItem[] => {
  // Get all approval statuses for this cadet
  const cadetApprovals = cadetApprovalStatuses.filter(
    (status) =>
      status.cadet_id === cadetId &&
      status.course_id === courseId &&
      status.semester_id === semesterId
  );

  // Sort all approvals chronologically by ID (creation order)
  const sortedApprovals = [...cadetApprovals].sort((a, b) => a.id - b.id);

  // Get all approval processes sorted by status_code
  const sortedProcesses = [...approvalProcesses].sort(
    (a, b) => parseInt(a.status_code || "0") - parseInt(b.status_code || "0")
  );

  // Build status list combining actual approvals and pending levels
  const statusList: ApprovalStatusItem[] = [];

  // Find the latest approval to get the current stage
  const latestApproval =
    sortedApprovals.length > 0
      ? sortedApprovals[sortedApprovals.length - 1]
      : null;

  // Determine current stage ID based on latest approval
  let currentStageId = latestApproval?.next_progress_id || null;

  // If next_progress_id is not set, calculate the next stage based on approval hierarchy
  if (
    !currentStageId &&
    latestApproval &&
    latestApproval.approval_status === "approved"
  ) {
    const latestProcess = approvalProcesses.find(
      (p) => p.id === latestApproval.progress_id
    );
    if (latestProcess) {
      const currentStatusCode = parseInt(latestProcess.status_code || "0");
      // Find the next process in sequence
      const nextProcess = sortedProcesses.find(
        (p) => parseInt(p.status_code || "0") === currentStatusCode + 1
      );
      if (nextProcess) {
        currentStageId = nextProcess.id;
      }
    }
  }

  // Add all actual approval events first
  sortedApprovals.forEach((approval, index) => {
    // Find the process for this approval
    const process = approvalProcesses.find((p) => p.id === approval.progress_id);

    // Determine if this is a re-submission (same level appearing again)
    const previousSameLevelApprovals = sortedApprovals
      .slice(0, index)
      .filter((a) => a.progress_id === approval.progress_id);
    const isResubmission = previousSameLevelApprovals.length > 0;

    const roleName = process?.role?.name || `Level ${approval.progress_id}`;
    const timestamp = new Date(
      approval.approved_at || approval.created_at || ""
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (approval.approval_status === "approved") {
      const approverText =
        profileId && approval.approved_by === profileId
          ? "me"
          : approval.approver?.name || "Unknown";

      statusList.push({
        roleName: isResubmission ? `${roleName} (Re-sub)` : roleName,
        text: `Approved by ${approverText}`,
        timestamp,
        color: "text-green-600",
        icon: "solar:check-circle-bold",
        isResubmission,
        remark: approval.remark || null,
        nextProgressId: approval.next_progress_id || null,
        processId: approval.progress_id,
        isPending: false,
      });
    } else if (approval.approval_status === "rejected") {
      const rejectorText =
        profileId && approval.approved_by === profileId
          ? "me"
          : approval.approver?.name || "Unknown";

      statusList.push({
        roleName: isResubmission ? `${roleName} (Re-sub)` : roleName,
        text: `Rejected by ${rejectorText}`,
        timestamp,
        color: "text-red-600",
        icon: "solar:close-circle-bold",
        isResubmission,
        remark: approval.remark || null,
        nextProgressId: approval.next_progress_id || null,
        processId: approval.progress_id,
        isPending: false,
      });
    }
  });

  // Add pending levels for processes that haven't been reached yet
  if (sortedApprovals.length === 0) {
    // If no approvals yet, show all processes as pending (first one is current stage)
    sortedProcesses.forEach((process, index) => {
      const isCurrentStage = index === 0;
      statusList.push({
        roleName: process.role?.name || `Level ${process.id}`,
        text: "Pending",
        timestamp: null,
        color: "text-gray-400",
        icon: "solar:clock-circle-linear",
        isResubmission: false,
        remark: null,
        nextProgressId: null,
        processId: process.id,
        isPending: true,
        isCurrentStage,
      });
    });
  } else {
    // If there are approvals, show future pending levels based on the approval process order
    const highestApprovedProcess = sortedApprovals
      .filter((a) => a.approval_status === "approved")
      .reduce((highest, current) => {
        if (!highest)
          return approvalProcesses.find((p) => p.id === current.progress_id);
        const currentProcess = approvalProcesses.find(
          (p) => p.id === current.progress_id
        );
        const highestCode = parseInt(highest.status_code || "0");
        const currentCode = parseInt(currentProcess?.status_code || "0");
        return currentCode > highestCode ? currentProcess : highest;
      }, null as ApprovalProcess | null | undefined);

    const highestApprovedCode = highestApprovedProcess
      ? parseInt(highestApprovedProcess.status_code || "0")
      : -1;

    // Track if we've marked a current stage
    let currentStageMarked = false;

    sortedProcesses.forEach((process) => {
      // Check if this process level has any approval records
      const hasRecord = sortedApprovals.some(
        (a) => a.progress_id === process.id
      );

      // If this is a level that has no records yet, show it as pending
      if (!hasRecord) {
        const thisProcessCode = parseInt(process.status_code || "0");

        // Show as pending if this process comes after the highest approved level
        if (thisProcessCode > highestApprovedCode) {
          // Mark as current stage if it matches currentStageId OR if it's the first pending level
          const isCurrentStage =
            currentStageId === process.id ||
            (!currentStageMarked && !currentStageId);

          if (isCurrentStage) {
            currentStageMarked = true;
          }

          statusList.push({
            roleName: process.role?.name || `Level ${process.id}`,
            text: "Pending",
            timestamp: null,
            color: "text-gray-400",
            icon: "solar:clock-circle-linear",
            isResubmission: false,
            remark: null,
            nextProgressId: null,
            processId: process.id,
            isPending: true,
            isCurrentStage,
          });
        }
      }
    });
  }

  return statusList;
};

/**
 * Check if all cadets have been approved at the current level
 */
export const checkAllCadetsApprovedByCurrentRole = (
  cadets: { cadet_details: { id: number } }[],
  cadetApprovalStatuses: CadetApprovalStatus[],
  approvalProcess: ApprovalProcess | null
): boolean => {
  if (!cadets || !approvalProcess || cadetApprovalStatuses.length === 0) {
    return false;
  }

  const currentProgressId = approvalProcess.id;
  const totalCadets = cadets.length;

  // Count how many cadets have been approved at the current progress level
  const approvedCadetsAtCurrentLevel = cadets.filter((cadet) => {
    const cadetId = cadet.cadet_details.id;

    // Find approvals for this cadet at current progress level
    const approvalForThisLevel = cadetApprovalStatuses.find(
      (status) =>
        status.cadet_id === cadetId &&
        status.progress_id === currentProgressId &&
        status.approval_status === "approved"
    );

    return !!approvalForThisLevel;
  });

  const approvedCount = approvedCadetsAtCurrentLevel.length;

  return approvedCount === totalCadets && totalCadets > 0;
};
