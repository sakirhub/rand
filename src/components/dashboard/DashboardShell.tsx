import {ReactNode} from "react";

interface DashboardShellProps {
    children: ReactNode;
    className?: string;
}

export function DashboardShell({
                                   children,
                                   className,
                                   ...props
                               }: DashboardShellProps) {
    return (
        <div className="grid items-start gap-8" {...props}>
            {children}
        </div>
    );
} 