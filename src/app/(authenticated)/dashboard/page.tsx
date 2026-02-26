"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/features/attendance/components/StatCard";
import { StatusBadge } from "@/features/attendance/components/StatusBadge";
import { Tooltip as RadixTooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Check, X, TrendingUp, Download } from "lucide-react";
import {
  statCards,
  dailyChartData,
  weeklyChartData,
  monthlyChartData,
  annualChartData,
  departmentData,
  liveFeed,
  otQueue,
  hodDepartmentData,
  auditTrail,
  departmentAttendanceBreakdown,
  attendancePipelineData,
  locationAttendanceData,
  hrActionItems,
  monthlyTrendData,
} from "@/features/attendance/data/mockData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from "recharts";

type Role = "superadmin" | "hr" | "hod";
type Period = "daily" | "weekly" | "monthly" | "annually";

const TOTAL_EMPLOYEES = 248;

const chartDataMap: Record<Period, typeof weeklyChartData> = {
  daily: dailyChartData,
  weekly: weeklyChartData,
  monthly: monthlyChartData,
  annually: annualChartData,
};

const hodChartDataMap: Record<Period, typeof weeklyChartData> = {
  daily: hodDepartmentData.daily,
  weekly: hodDepartmentData.weekly,
  monthly: hodDepartmentData.monthly,
  annually: hodDepartmentData.annually,
};

const periodLabels: Record<Period, string> = {
  daily: "Today's overview",
  weekly: "This week's overview",
  monthly: "This month's overview",
  annually: "This year's overview",
};

const roleLabels: Record<Role, string> = {
  superadmin: "Super Admin",
  hr: "Admin / HR",
  hod: "HOD",
};

// ── Custom Recharts tooltip renderer ──
type TooltipPayloadEntry = { value?: number; name?: string; dataKey?: string; color?: string; fill?: string };
function ChartTooltipRenderer({ active, payload, label, totalRef }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; totalRef?: number }) {
  if (!active || !payload?.length) return null;
  const total = totalRef ?? TOTAL_EMPLOYEES;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl min-w-[140px]">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((entry: TooltipPayloadEntry, i: number) => {
        const pct = total > 0 ? (((entry.value ?? 0) / total) * 100).toFixed(1) : "—";
        return (
          <div key={i} className="flex items-center justify-between gap-3 py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-muted-foreground">{entry.name || entry.dataKey}</span>
            </span>
            <span className="font-semibold text-foreground">{entry.value ?? 0} <span className="font-normal text-muted-foreground">({pct}%)</span></span>
          </div>
        );
      })}
    </div>
  );
}

// ── Pie chart tooltip with rank ──
function PieTooltipRenderer({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  if (!item) return null;
  const sorted = [...departmentData].sort((a, b) => b.value - a.value);
  const rank = sorted.findIndex((d) => d.name === item.name) + 1;
  const totalDept = departmentData.reduce((s, d) => s + d.value, 0);
  const pct = (((item.value ?? 0) / totalDept) * 100).toFixed(1);
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="text-muted-foreground">Employees: <span className="font-semibold text-foreground">{item.value ?? 0}</span></p>
      <p className="text-muted-foreground">Share: <span className="font-semibold text-foreground">{pct}%</span></p>
      <p className="text-muted-foreground">Rank: <span className="font-semibold text-foreground">#{rank}</span></p>
    </div>
  );
}

// ── Radial tooltip ──
function RadialTooltipRenderer({ active, payload, metricName }: { active?: boolean; payload?: TooltipPayloadEntry[]; metricName?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{metricName}</p>
      <p className="text-muted-foreground">Value: <span className="font-semibold text-foreground">{payload[0]?.value ?? 0}%</span></p>
    </div>
  );
}

// Shared chart component
function AttendanceChart({ data, subtitle }: { data: typeof weeklyChartData; subtitle: string }) {
  return (
    <>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(230, 70%, 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(230, 70%, 55%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradWfh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(270, 60%, 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(270, 60%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
          <RechartsTooltip content={<ChartTooltipRenderer />} />
          <Area type="monotone" dataKey="present" stroke="hsl(230, 70%, 55%)" fill="url(#gradPresent)" strokeWidth={2} name="Present" />
          <Area type="monotone" dataKey="wfh" stroke="hsl(270, 60%, 55%)" fill="url(#gradWfh)" strokeWidth={2} name="WFH" />
          <Area type="monotone" dataKey="late" stroke="hsl(340, 65%, 55%)" fill="hsl(340, 65%, 55%)" fillOpacity={0.1} strokeWidth={2} name="Late" />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}

// ───────── Superadmin Dashboard ─────────
function SuperadminDashboard({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 premium-shadow border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Attendance Performance</CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs px-2.5 h-6">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2.5 h-6">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2.5 h-6">Monthly</TabsTrigger>
                <TabsTrigger value="annually" className="text-xs px-2.5 h-6">Annually</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={chartDataMap[period]} subtitle={periodLabels[period]} />
          </CardContent>
        </Card>

        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">By Department</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Present today</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" cornerRadius={6}>
                  {departmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <RechartsTooltip content={<PieTooltipRenderer />} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown + Location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Attendance by Department</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Breakdown: Present · Late · WFH · Absent</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={departmentAttendanceBreakdown} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" width={80} />
                <RechartsTooltip content={<ChartTooltipRenderer />} />
                <Bar dataKey="present" stackId="a" fill="hsl(145, 60%, 40%)" radius={[0, 0, 0, 0]} name="Present" />
                <Bar dataKey="late" stackId="a" fill="hsl(38, 92%, 50%)" name="Late" />
                <Bar dataKey="wfh" stackId="a" fill="hsl(340, 65%, 65%)" name="WFH" />
                <Bar dataKey="absent" stackId="a" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Attendance by Location</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Today&apos;s rates</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationAttendanceData.map((loc, idx) => (
              <RadixTooltip key={loc.location}>
                <TooltipTrigger asChild>
                  <div className="space-y-1.5 cursor-default">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{loc.location}</span>
                      <span className="text-xs text-muted-foreground">{loc.employees} emp · {loc.rate}%</span>
                    </div>
                    <Progress value={loc.rate} className="h-2" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">{loc.location}</p>
                  <p>Employees: {loc.employees}</p>
                  <p>Attendance: {loc.rate}%</p>
                  <p>Rank: #{idx + 1} of {locationAttendanceData.length}</p>
                </TooltipContent>
              </RadixTooltip>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Pipeline */}
      <Card className="premium-shadow border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Attendance Pipeline</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Employee quality gates for today</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48">
            {attendancePipelineData.map((item, i) => {
              const maxVal = attendancePipelineData[0]?.value ?? 1;
              const heightPct = (item.value / maxVal) * 100;
              const pct = ((item.value / maxVal) * 100).toFixed(1);
              return (
                <RadixTooltip key={item.stage}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex flex-col items-center gap-2 cursor-default">
                      <span className="text-sm font-bold text-foreground">{item.value}</span>
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{ height: `${heightPct}%`, backgroundColor: item.fill, minHeight: "20px" }}
                      />
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.stage}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{item.stage}</p>
                    <p>{item.value} / {maxVal} ({pct}%)</p>
                    <p>Stage #{i + 1} of {attendancePipelineData.length}</p>
                  </TooltipContent>
                </RadixTooltip>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Live Attendance Feed</CardTitle>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] px-6">
              <div className="space-y-1">
                {liveFeed.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{item.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={item.action} />
                      <p className="text-[11px] text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">OT Approval Queue</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{otQueue.filter(o => o.status === "Pending").length} pending requests</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] px-6">
              <div className="space-y-1">
                {otQueue.filter(o => o.status === "Pending").map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.dept} · {item.hours}hrs · {item.date}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:bg-success/10"><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ───────── Admin / HR Dashboard ─────────
function HRDashboard({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  const hrRadialData = [
    { name: "Attendance", value: 94.2, fill: "hsl(145, 60%, 40%)" },
    { name: "Late %", value: 4.8, fill: "hsl(38, 92%, 50%)" },
    { name: "WFH Rate", value: 12.9, fill: "hsl(340, 65%, 55%)" },
  ];
  const priorityColors: Record<string, string> = {
    high: "from-red-400 to-rose-500",
    medium: "from-amber-300 to-yellow-500",
    low: "from-emerald-400 to-green-500",
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {hrRadialData.map((item) => (
          <Card key={item.name} className="premium-shadow border-0">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-20 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ value: item.value, fill: item.fill }]}>
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(220, 20%, 95%)" }} />
                    <RechartsTooltip content={<RadialTooltipRenderer metricName={item.name} />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{item.value}%</p>
                <p className="text-xs text-muted-foreground font-medium">{item.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 premium-shadow border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Attendance Performance</CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs px-2.5 h-6">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2.5 h-6">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2.5 h-6">Monthly</TabsTrigger>
                <TabsTrigger value="annually" className="text-xs px-2.5 h-6">Annually</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={chartDataMap[period]} subtitle={periodLabels[period]} />
          </CardContent>
        </Card>
        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Attendance rate %</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <RechartsTooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="text-muted-foreground">Attendance Rate: <span className="font-semibold text-foreground">{payload[0]?.value ?? 0}%</span></p>
                    </div>
                  );
                }} />
                <Bar dataKey="rate" fill="hsl(230, 70%, 55%)" radius={[4, 4, 0, 0]} name="Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Action Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hrActionItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-r ${priorityColors[item.priority]}`}>
                  {item.priority.toUpperCase()}
                </span>
                <span className="text-sm text-foreground">{item.title}</span>
              </div>
            ))}
            <Button variant="outline" className="w-full justify-start gap-2 mt-2"><Download className="h-4 w-4" /> Export Attendance Report</Button>
          </CardContent>
        </Card>
        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Audit Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[250px] px-6">
              <div className="space-y-1">
                {auditTrail.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3 border-b border-border/50 last:border-0">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.details} · {item.timestamp}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ───────── HOD Dashboard ─────────
function HODDashboard({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  const deptRate = 83.3;
  const teamBreakdown = [
    { label: "Present", count: 60, color: "from-emerald-400 to-green-500" },
    { label: "Late", count: 4, color: "from-amber-300 to-yellow-500" },
    { label: "WFH", count: 8, color: "from-pink-300 to-pink-500" },
    { label: "Absent", count: 2, color: "from-red-400 to-rose-500" },
  ];
  const total = teamBreakdown.reduce((s, b) => s + b.count, 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Dept. Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ value: deptRate, fill: "hsl(145, 60%, 40%)" }]}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(220, 20%, 95%)" }} />
                  <RechartsTooltip content={<RadialTooltipRenderer metricName="Engineering Attendance" />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-3xl font-bold text-foreground -mt-2">{deptRate}%</p>
            <p className="text-xs text-muted-foreground">Engineering</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 premium-shadow border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Team Members by Status</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{total} total members</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-6 rounded-full overflow-hidden">
              {teamBreakdown.map((seg) => (
                <RadixTooltip key={seg.label}>
                  <TooltipTrigger asChild>
                    <div className={`bg-gradient-to-r ${seg.color} transition-all cursor-default`} style={{ width: `${(seg.count / total) * 100}%` }} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{seg.label}</p>
                    <p>{seg.count} of {total} ({((seg.count / total) * 100).toFixed(1)}%)</p>
                  </TooltipContent>
                </RadixTooltip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {teamBreakdown.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full bg-gradient-to-r ${seg.color}`} />
                  <span className="text-sm text-foreground font-medium">{seg.count}</span>
                  <span className="text-xs text-muted-foreground">{seg.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Present Today" value="60" change="83.3%" changeType="up" color="green" />
        <StatCard title="Late Arrivals" value="4" change="+1" changeType="up" color="orange" />
        <StatCard title="Work From Home" value="8" change="+2" changeType="up" color="purple" />
      </div>
      <Card className="premium-shadow border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Department Performance</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-2.5 h-6">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2.5 h-6">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2.5 h-6">Monthly</TabsTrigger>
              <TabsTrigger value="annually" className="text-xs px-2.5 h-6">Annually</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <AttendanceChart data={hodChartDataMap[period]} subtitle={`Engineering — ${periodLabels[period]}`} />
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  const [role, setRole] = useState<Role>("superadmin");
  const [period, setPeriod] = useState<Period>("weekly");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {roleLabels[role]}. Here&apos;s today&apos;s overview.</p>
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="superadmin">Super Admin</SelectItem>
            <SelectItem value="hr">Admin / HR</SelectItem>
            <SelectItem value="hod">HOD</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {role === "superadmin" && <SuperadminDashboard period={period} setPeriod={setPeriod} />}
      {role === "hr" && <HRDashboard period={period} setPeriod={setPeriod} />}
      {role === "hod" && <HODDashboard period={period} setPeriod={setPeriod} />}
    </div>
  );
}
