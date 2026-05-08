export const statCards = [
  { title: "Total Employees", value: "248", change: "+12", changeType: "up" as const, color: "blue" as const },
  { title: "Present Today", value: "198", change: "79.8%", changeType: "up" as const, color: "green" as const },
  { title: "On Leave", value: "18", change: "-3", changeType: "down" as const, color: "orange" as const },
  { title: "Late Arrivals", value: "12", change: "+2", changeType: "up" as const, color: "pink" as const },
  { title: "Work From Home", value: "32", change: "+5", changeType: "up" as const, color: "purple" as const },
  { title: "OT Pending", value: "7", change: "3 urgent", changeType: "neutral" as const, color: "cyan" as const },
];

export const attendanceChartData = [
  { date: "Mon", present: 190, late: 10, absent: 15, wfh: 33 },
  { date: "Tue", present: 195, late: 8, absent: 12, wfh: 33 },
  { date: "Wed", present: 198, late: 12, absent: 18, wfh: 20 },
  { date: "Thu", present: 185, late: 15, absent: 20, wfh: 28 },
  { date: "Fri", present: 192, late: 9, absent: 14, wfh: 33 },
  { date: "Sat", present: 50, late: 2, absent: 196, wfh: 0 },
  { date: "Sun", present: 0, late: 0, absent: 248, wfh: 0 },
];

export const weeklyChartData = attendanceChartData;

export const dailyChartData = [
  { date: "6AM", present: 5, late: 0, absent: 243, wfh: 0 },
  { date: "7AM", present: 30, late: 0, absent: 218, wfh: 5 },
  { date: "8AM", present: 120, late: 0, absent: 108, wfh: 20 },
  { date: "9AM", present: 180, late: 12, absent: 24, wfh: 32 },
  { date: "10AM", present: 198, late: 12, absent: 6, wfh: 32 },
  { date: "11AM", present: 198, late: 12, absent: 6, wfh: 32 },
  { date: "12PM", present: 198, late: 12, absent: 6, wfh: 32 },
];

export const monthlyChartData = [
  { date: "Week 1", present: 188, late: 14, absent: 20, wfh: 26 },
  { date: "Week 2", present: 192, late: 10, absent: 18, wfh: 28 },
  { date: "Week 3", present: 195, late: 8, absent: 15, wfh: 30 },
  { date: "Week 4", present: 198, late: 12, absent: 12, wfh: 26 },
];

export const annualChartData = [
  { date: "Jan", present: 185, late: 15, absent: 22, wfh: 26 },
  { date: "Feb", present: 190, late: 12, absent: 18, wfh: 28 },
  { date: "Mar", present: 192, late: 10, absent: 16, wfh: 30 },
  { date: "Apr", present: 188, late: 14, absent: 20, wfh: 26 },
  { date: "May", present: 195, late: 8, absent: 15, wfh: 30 },
  { date: "Jun", present: 190, late: 11, absent: 19, wfh: 28 },
  { date: "Jul", present: 182, late: 16, absent: 25, wfh: 25 },
  { date: "Aug", present: 178, late: 18, absent: 28, wfh: 24 },
  { date: "Sep", present: 191, late: 10, absent: 17, wfh: 30 },
  { date: "Oct", present: 193, late: 9, absent: 16, wfh: 30 },
  { date: "Nov", present: 192, late: 11, absent: 17, wfh: 28 },
  { date: "Dec", present: 180, late: 14, absent: 30, wfh: 24 },
];

export const departmentData = [
  { name: "Engineering", value: 72, fill: "hsl(230, 70%, 55%)" },
  { name: "Marketing", value: 35, fill: "hsl(145, 60%, 40%)" },
  { name: "Sales", value: 45, fill: "hsl(30, 80%, 50%)" },
  { name: "HR", value: 18, fill: "hsl(270, 60%, 55%)" },
  { name: "Finance", value: 28, fill: "hsl(340, 65%, 55%)" },
];

export const liveFeed = [
  { id: 1, name: "Sarah Chen", action: "Clocked In", time: "08:02 AM", location: "HQ - Floor 3", avatar: "SC" },
  { id: 2, name: "James Wilson", action: "Clocked In", time: "08:05 AM", location: "HQ - Floor 1", avatar: "JW" },
  { id: 3, name: "Maria Garcia", action: "Clocked In (WFH)", time: "08:10 AM", location: "Remote", avatar: "MG" },
  { id: 4, name: "Alex Kim", action: "Clocked In (Late)", time: "09:15 AM", location: "HQ - Floor 2", avatar: "AK" },
  { id: 5, name: "David Lee", action: "Clocked Out", time: "05:02 PM", location: "HQ - Floor 3", avatar: "DL" },
  { id: 6, name: "Emma Brown", action: "Clocked In", time: "07:58 AM", location: "Branch - East", avatar: "EB" },
  { id: 7, name: "Tom Harris", action: "Clocked In (WFH)", time: "08:30 AM", location: "Remote", avatar: "TH" },
];

export const otQueue = [
  { id: 1, name: "Sarah Chen", dept: "Engineering", date: "2026-02-24", hours: 2.5, reason: "Sprint deadline", status: "Pending" as const },
  { id: 2, name: "James Wilson", dept: "Marketing", date: "2026-02-23", hours: 3, reason: "Campaign launch", status: "Pending" as const },
  { id: 3, name: "Alex Kim", dept: "Sales", date: "2026-02-24", hours: 1.5, reason: "Client meeting", status: "Pending" as const },
  { id: 4, name: "Maria Garcia", dept: "Engineering", date: "2026-02-22", hours: 4, reason: "Production hotfix", status: "Approved" as const },
  { id: 5, name: "Emma Brown", dept: "HR", date: "2026-02-21", hours: 2, reason: "Recruitment event", status: "Rejected" as const },
  { id: 6, name: "David Lee", dept: "Finance", date: "2026-02-24", hours: 3, reason: "Quarter-end closing", status: "Pending" as const },
  { id: 7, name: "Tom Harris", dept: "Engineering", date: "2026-02-23", hours: 2, reason: "Code review backlog", status: "Pending" as const },
];

export const attendanceLogs = [
  { id: 1, name: "Sarah Chen", date: "2026-02-25", clockIn: "08:02", clockOut: "17:05", hours: "9h 03m", location: "HQ - Floor 3", status: "Present" as const },
  { id: 2, name: "James Wilson", date: "2026-02-25", clockIn: "08:05", clockOut: "17:10", hours: "9h 05m", location: "HQ - Floor 1", status: "Present" as const },
  { id: 3, name: "Maria Garcia", date: "2026-02-25", clockIn: "08:10", clockOut: "17:15", hours: "9h 05m", location: "Remote", status: "WFH" as const },
  { id: 4, name: "Alex Kim", date: "2026-02-25", clockIn: "09:15", clockOut: "18:20", hours: "9h 05m", location: "HQ - Floor 2", status: "Late" as const },
  { id: 5, name: "David Lee", date: "2026-02-25", clockIn: "07:55", clockOut: "17:02", hours: "9h 07m", location: "HQ - Floor 3", status: "Present" as const },
  { id: 6, name: "Emma Brown", date: "2026-02-25", clockIn: "--", clockOut: "--", hours: "--", location: "--", status: "Absent" as const },
  { id: 7, name: "Tom Harris", date: "2026-02-25", clockIn: "08:30", clockOut: "17:35", hours: "9h 05m", location: "Remote", status: "WFH" as const },
  { id: 8, name: "Lisa Wang", date: "2026-02-25", clockIn: "08:00", clockOut: "17:00", hours: "9h 00m", location: "Branch - East", status: "Present" as const },
];

export const attendanceDetails: Record<
  number,
  {
    department: string;
    avatar: string;
    remarks: string;
    punchRecords: { time: string; type: "in" | "out"; location: string }[];
  }
> = {
  1: { department: "Engineering", avatar: "SC", remarks: "Regular day", punchRecords: [{ time: "08:02", type: "in", location: "HQ - Floor 3" }, { time: "12:00", type: "out", location: "HQ - Floor 3" }, { time: "13:00", type: "in", location: "HQ - Floor 3" }, { time: "17:05", type: "out", location: "HQ - Floor 3" }] },
  2: { department: "Marketing", avatar: "JW", remarks: "Campaign prep week", punchRecords: [{ time: "08:05", type: "in", location: "HQ - Floor 1" }, { time: "17:10", type: "out", location: "HQ - Floor 1" }] },
  3: { department: "Engineering", avatar: "MG", remarks: "Working from home - sprint tasks", punchRecords: [{ time: "08:10", type: "in", location: "Remote" }, { time: "12:30", type: "out", location: "Remote" }, { time: "13:15", type: "in", location: "Remote" }, { time: "17:15", type: "out", location: "Remote" }] },
  4: { department: "Sales", avatar: "AK", remarks: "Late due to traffic - notified manager", punchRecords: [{ time: "09:15", type: "in", location: "HQ - Floor 2" }, { time: "18:20", type: "out", location: "HQ - Floor 2" }] },
  5: { department: "Engineering", avatar: "DL", remarks: "", punchRecords: [{ time: "07:55", type: "in", location: "HQ - Floor 3" }, { time: "12:00", type: "out", location: "HQ - Floor 3" }, { time: "12:45", type: "in", location: "HQ - Floor 3" }, { time: "17:02", type: "out", location: "HQ - Floor 3" }] },
  6: { department: "HR", avatar: "EB", remarks: "Absent - sick leave", punchRecords: [] },
  7: { department: "Engineering", avatar: "TH", remarks: "WFH - code review tasks", punchRecords: [{ time: "08:30", type: "in", location: "Remote" }, { time: "17:35", type: "out", location: "Remote" }] },
  8: { department: "Finance", avatar: "LW", remarks: "", punchRecords: [{ time: "08:00", type: "in", location: "Branch - East" }, { time: "12:15", type: "out", location: "Branch - East" }, { time: "13:00", type: "in", location: "Branch - East" }, { time: "17:00", type: "out", location: "Branch - East" }] },
};

export const workLocations = [
  { id: 1, name: "HQ - Floor 1", address: "100 Main St, Floor 1", city: "San Francisco", status: "Active" as const },
  { id: 2, name: "HQ - Floor 2", address: "100 Main St, Floor 2", city: "San Francisco", status: "Active" as const },
  { id: 3, name: "HQ - Floor 3", address: "100 Main St, Floor 3", city: "San Francisco", status: "Active" as const },
  { id: 4, name: "Branch - East", address: "250 East Ave", city: "New York", status: "Active" as const },
  { id: 5, name: "Branch - South", address: "80 South Blvd", city: "Austin", status: "Inactive" as const },
];

export const shifts = [
  { id: 1, name: "Morning Shift", startTime: "08:30", endTime: "17:30", status: "Active" as const },
  { id: 2, name: "Regular Shift", startTime: "09:00", endTime: "18:00", status: "Active" as const },
  { id: 3, name: "Afternoon Shift", startTime: "13:00", endTime: "22:00", status: "Inactive" as const },
  { id: 4, name: "Night Shift", startTime: "22:00", endTime: "06:00", status: "Inactive" as const },
];

export const hodDepartmentData = {
  daily: [
    { date: "6AM", present: 2, late: 0, absent: 70, wfh: 0 },
    { date: "7AM", present: 8, late: 0, absent: 64, wfh: 2 },
    { date: "8AM", present: 40, late: 0, absent: 22, wfh: 10 },
    { date: "9AM", present: 58, late: 4, absent: 4, wfh: 10 },
    { date: "10AM", present: 60, late: 4, absent: 2, wfh: 10 },
    { date: "11AM", present: 60, late: 4, absent: 2, wfh: 10 },
  ],
  weekly: [
    { date: "Mon", present: 60, late: 3, absent: 5, wfh: 10 },
    { date: "Tue", present: 62, late: 2, absent: 4, wfh: 10 },
    { date: "Wed", present: 58, late: 4, absent: 6, wfh: 8 },
    { date: "Thu", present: 56, late: 5, absent: 7, wfh: 10 },
    { date: "Fri", present: 60, late: 3, absent: 5, wfh: 10 },
  ],
  monthly: [
    { date: "Week 1", present: 58, late: 4, absent: 6, wfh: 8 },
    { date: "Week 2", present: 60, late: 3, absent: 5, wfh: 10 },
    { date: "Week 3", present: 62, late: 2, absent: 4, wfh: 10 },
    { date: "Week 4", present: 60, late: 4, absent: 4, wfh: 8 },
  ],
  annually: [
    { date: "Jan", present: 56, late: 5, absent: 7, wfh: 8 },
    { date: "Feb", present: 58, late: 4, absent: 6, wfh: 8 },
    { date: "Mar", present: 60, late: 3, absent: 5, wfh: 10 },
    { date: "Apr", present: 57, late: 5, absent: 6, wfh: 8 },
    { date: "May", present: 62, late: 2, absent: 4, wfh: 10 },
    { date: "Jun", present: 59, late: 4, absent: 5, wfh: 8 },
    { date: "Jul", present: 55, late: 6, absent: 8, wfh: 7 },
    { date: "Aug", present: 52, late: 7, absent: 10, wfh: 7 },
    { date: "Sep", present: 60, late: 3, absent: 5, wfh: 10 },
    { date: "Oct", present: 61, late: 3, absent: 4, wfh: 10 },
    { date: "Nov", present: 60, late: 4, absent: 4, wfh: 8 },
    { date: "Dec", present: 54, late: 5, absent: 9, wfh: 8 },
  ],
};

export const auditTrail = [
  { id: 1, timestamp: "2026-02-25 09:15:00", user: "Admin", action: "Approved OT request", details: "Sarah Chen - 2.5hrs on Feb 24" },
  { id: 2, timestamp: "2026-02-25 08:30:00", user: "System", action: "Late arrival flagged", details: "Alex Kim clocked in at 09:15" },
  { id: 3, timestamp: "2026-02-24 17:00:00", user: "Admin", action: "Updated work location", details: "Branch - South set to Inactive" },
  { id: 4, timestamp: "2026-02-24 14:20:00", user: "Admin", action: "Rejected OT request", details: "Emma Brown - 2hrs on Feb 21" },
  { id: 5, timestamp: "2026-02-24 10:00:00", user: "System", action: "Daily attendance report", details: "Generated for Feb 24" },
  { id: 6, timestamp: "2026-02-23 16:45:00", user: "HR Manager", action: "Added employee", details: "New hire: Lisa Wang - Engineering" },
];

export const reportStats = [
  { label: "Avg Working Hours", value: "8.7h", trend: "+0.2h" },
  { label: "Attendance Rate", value: "94.2%", trend: "+1.5%" },
  { label: "Late Percentage", value: "4.8%", trend: "-0.3%" },
  { label: "WFH Rate", value: "12.9%", trend: "+2.1%" },
];

export const monthlyTrendData = [
  { month: "Sep", rate: 91 },
  { month: "Oct", rate: 93 },
  { month: "Nov", rate: 92 },
  { month: "Dec", rate: 88 },
  { month: "Jan", rate: 94 },
  { month: "Feb", rate: 94.2 },
];

export const sparklineDataMap: Record<string, number[]> = {
  "Total Employees": [240, 242, 243, 245, 246, 247, 248],
  "Present Today": [185, 190, 192, 188, 195, 192, 198],
  "On Leave": [22, 20, 18, 24, 15, 20, 18],
  "Late Arrivals": [8, 14, 10, 16, 12, 9, 12],
  "Work From Home": [25, 28, 30, 26, 32, 28, 32],
  "OT Pending": [5, 8, 4, 10, 6, 9, 7],
};

export const departmentAttendanceBreakdown = [
  { department: "Engineering", present: 58, late: 4, wfh: 8, absent: 2 },
  { department: "Marketing", present: 28, late: 3, wfh: 2, absent: 2 },
  { department: "Sales", present: 36, late: 3, wfh: 4, absent: 2 },
  { department: "HR", present: 14, late: 1, wfh: 2, absent: 1 },
  { department: "Finance", present: 22, late: 2, wfh: 3, absent: 1 },
];

export const attendancePipelineData = [
  { stage: "Total Employees", value: 248, fill: "hsl(230, 70%, 55%)" },
  { stage: "Present", value: 198, fill: "hsl(145, 60%, 40%)" },
  { stage: "On Time", value: 186, fill: "hsl(185, 60%, 40%)" },
  { stage: "Full Day", value: 172, fill: "hsl(270, 60%, 55%)" },
  { stage: "No Issues", value: 160, fill: "hsl(30, 80%, 50%)" },
];

export const locationAttendanceData = [
  { location: "HQ - Floor 1", employees: 65, rate: 96 },
  { location: "HQ - Floor 2", employees: 58, rate: 92 },
  { location: "HQ - Floor 3", employees: 52, rate: 94 },
  { location: "Branch - East", employees: 41, rate: 88 },
  { location: "Remote / WFH", employees: 32, rate: 100 },
];

export const hrActionItems = [
  { id: 1, title: "Review pending OT requests (7)", priority: "high" as const },
  { id: 2, title: "Update Q1 attendance report", priority: "medium" as const },
  { id: 3, title: "Follow up on 3 absent employees", priority: "high" as const },
  { id: 4, title: "Schedule shift rotation review", priority: "low" as const },
];
