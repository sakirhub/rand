"use client"

import * as React from "react"
import {cn} from "@/lib/utils"

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
}

export function TooltipProvider({children}: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function Tooltip({children, content, side = "top"}: TooltipProps) {
    const [isVisible, setIsVisible] = React.useState(false);
    const [position, setPosition] = React.useState({top: 0, left: 0});
    const triggerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();

            let top = 0;
            let left = 0;

            switch (side) {
                case "top":
                    top = rect.top - 10;
                    left = rect.left + rect.width / 2;
                    break;
                case "right":
                    top = rect.top + rect.height / 2;
                    left = rect.right + 10;
                    break;
                case "bottom":
                    top = rect.bottom + 10;
                    left = rect.left + rect.width / 2;
                    break;
                case "left":
                    top = rect.top + rect.height / 2;
                    left = rect.left - 10;
                    break;
            }

            setPosition({top, left});
        }
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <div className="relative inline-block">
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-block"
            >
                {children}
            </div>

            {isVisible && (
                <div
                    className={cn(
                        "absolute z-50 p-2 bg-popover text-popover-foreground rounded-md border shadow-md text-sm",
                        "max-w-xs"
                    )}
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        transform: side === "top" ? "translate(-50%, -100%)" :
                            side === "right" ? "translateY(-50%)" :
                                side === "bottom" ? "translate(-50%, 0)" :
                                    "translate(-100%, -50%)"
                    }}
                >
                    {content}
                </div>
            )}
        </div>
    );
}

export const TooltipTrigger = ({asChild, children}: { asChild?: boolean, children: React.ReactNode }) => {
    return <>{children}</>;
};

export const TooltipContent = ({children, className, ...props}: {
    children: React.ReactNode,
    className?: string,
    [key: string]: any
}) => {
    return <div className={className} {...props}>{children}</div>;
}; 