"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, X, Plus, Clock } from "lucide-react";
import { otQueue } from "@/features/attendance/data/mockData";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Pending: "outline",
  Approved: "default",
  Rejected: "destructive",
};

export default function OvertimePage() {
  const [tab, setTab] = useState("all");

  const filtered = tab === "all" ? otQueue : otQueue.filter((o) => o.status.toLowerCase() === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overtime Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit, review, and manage overtime requests.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New OT Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit OT Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Hours</Label>
                  <Input type="number" placeholder="e.g. 2.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea placeholder="Describe the reason for overtime..." rows={3} />
              </div>
              <Button className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="premium-shadow border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">OT Requests</CardTitle>
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2.5 h-6">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs px-2.5 h-6">Pending</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs px-2.5 h-6">Approved</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs px-2.5 h-6">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Employee</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Department</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Hours</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Reason</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-sm">{item.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.dept}</TableCell>
                  <TableCell className="text-sm">{item.date}</TableCell>
                  <TableCell className="text-sm">{item.hours}h</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.reason}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[item.status]} className="text-[10px]">{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "Pending" && (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:bg-success/10">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
