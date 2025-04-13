"use client";

import {Button} from "@/components/ui/button";
import {LayoutGrid, LayoutList} from "lucide-react";

interface ViewToggleProps {
    onViewChange: (view: "list" | "table") => void;
    currentView: "list" | "table";
}

export function ViewToggle({onViewChange, currentView}: ViewToggleProps) {
    return (
        <div className="flex space-x-2">
            <Button
                variant={currentView === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("list")}
                title="Liste Görünümü"
            >
                <LayoutList className="h-4 w-4"/>
            </Button>
            <Button
                variant={currentView === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("table")}
                title="Tablo Görünümü"
            >
                <LayoutGrid className="h-4 w-4"/>
            </Button>
        </div>
    );
} 