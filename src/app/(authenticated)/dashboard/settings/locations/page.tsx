"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { workLocations } from "@/features/attendance/data/mockData";

export default function WorkLocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Work Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pre-registered work locations.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Work Location</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Location Name</Label><Input placeholder="e.g. HQ - Floor 4" /></div>
              <div className="space-y-2"><Label>Address</Label><Input placeholder="Street address" /></div>
              <div className="space-y-2"><Label>City</Label><Input placeholder="City" /></div>
              <Button className="w-full">Add Location</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="premium-shadow border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Registered Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Address</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">City</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workLocations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium text-sm">{loc.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{loc.address}</TableCell>
                  <TableCell className="text-sm">{loc.city}</TableCell>
                  <TableCell>
                    <Badge variant={loc.status === "Active" ? "default" : "secondary"} className="text-[10px]">{loc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
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
