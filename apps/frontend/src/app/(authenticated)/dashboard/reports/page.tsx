"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, TrendingUp, Webhook } from "lucide-react";
import { reportStats, monthlyTrendData } from "@/features/attendance/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Export</h1>
          <p className="text-sm text-muted-foreground mt-1">Attendance statistics and data exports.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="premium-shadow border-0">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input type="date" className="h-9 w-40" />
            <span className="text-sm text-muted-foreground">to</span>
            <Input type="date" className="h-9 w-40" />
            <Select>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Work Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="wfh">WFH</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm">Apply</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportStats.map((stat) => (
          <Card key={stat.label} className="premium-shadow border-0 p-5">
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <TrendingUp className="h-3 w-3" /> {stat.trend}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="premium-shadow border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Monthly Attendance Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
              <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "none", boxShadow: "0 4px 20px -4px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Bar dataKey="rate" fill="hsl(230, 70%, 55%)" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="premium-shadow border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Webhook Integration</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Configure external integrations (e.g., LarkBase)</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input placeholder="https://hooks.example.com/webhook" className="flex-1" />
            <Button variant="secondary">Save</Button>
            <Button variant="outline">Test</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
