"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Monitor, Home } from "lucide-react";

const employees = [
  { id: 1, name: "Sarah Chen", dept: "Engineering", mode: "On-site" },
  { id: 2, name: "James Wilson", dept: "Marketing", mode: "On-site" },
  { id: 3, name: "Maria Garcia", dept: "Engineering", mode: "WFH" },
  { id: 4, name: "Alex Kim", dept: "Sales", mode: "On-site" },
  { id: 5, name: "Tom Harris", dept: "Engineering", mode: "WFH" },
];

export default function WorkModePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Work Mode Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure on-site and WFH modes.</p>
      </div>
      <Card className="premium-shadow border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Global Work Mode</CardTitle>
          <CardDescription>Enable WFH globally for all employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm"><Monitor className="h-4 w-4" /> On-site</div>
            <Switch />
            <div className="flex items-center gap-2 text-sm"><Home className="h-4 w-4" /> WFH</div>
          </div>
        </CardContent>
      </Card>
      <Card className="premium-shadow border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Per-Employee Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{emp.name}</p>
                <p className="text-xs text-muted-foreground">{emp.dept}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={emp.mode === "WFH" ? "secondary" : "outline"} className="text-[10px]">{emp.mode}</Badge>
                <Switch defaultChecked={emp.mode === "WFH"} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
