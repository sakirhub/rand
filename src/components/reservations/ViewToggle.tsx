"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";

interface ViewToggleProps {
  currentView: "list" | "table";
  onViewChange: (view: "list" | "table") => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-1 bg-muted rounded-md p-1">
      <Button
        variant={currentView === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className="h-8 w-8 p-0"
        aria-label="Liste görünümü"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={currentView === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className="h-8 w-8 p-0"
        aria-label="Tablo görünümü"
      >
        <LayoutList className="h-4 w-4" />
      </Button>
    </div>
  );
} 