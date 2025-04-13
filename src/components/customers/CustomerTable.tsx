"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerActions } from "./CustomerActions";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nationality: 'turkish' | 'german' | 'russian' | 'british' | 'american' | 'french' | 'italian' | 'spanish' | 'portuguese' | 'dutch' | 'belgian' | 'swiss' | 'austrian' | 'swedish' | 'norwegian' | 'danish' | 'finnish' | 'polish' | 'czech' | 'slovak' | 'hungarian' | 'romanian' | 'bulgarian' | 'greek' | 'ukrainian' | 'other';
  created_at: string;
  updated_at: string;
};

const nationalityLabels = {
  turkish: "Türk",
  german: "Deutsch",
  russian: "Русский",
  british: "British",
  american: "American",
  french: "Français",
  italian: "Italiano",
  spanish: "Español",
  portuguese: "Português",
  dutch: "Nederlands",
  belgian: "Belgisch",
  swiss: "Schweizer",
  austrian: "Österreicher",
  swedish: "Svensk",
  norwegian: "Norsk",
  danish: "Dansk",
  finnish: "Suomalainen",
  polish: "Polski",
  czech: "Český",
  slovak: "Slovenský",
  hungarian: "Magyar",
  romanian: "Român",
  bulgarian: "Българин",
  greek: "Έλληνας",
  ukrainian: "Українець",
  other: "Diğer"
};

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Müşteri Adı",
  },
  {
    accessorKey: "email",
    header: "E-posta",
  },
  {
    accessorKey: "phone",
    header: "Telefon",
  },
  {
    accessorKey: "nationality",
    header: "Uyruk",
    cell: ({ row }) => {
      const nationality = row.getValue("nationality") as keyof typeof nationalityLabels;
      return nationalityLabels[nationality] || "-";
    },
  },
  {
    accessorKey: "created_at",
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString("tr-TR");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;
      return <CustomerActions customer={customer} />;
    },
  },
];

interface CustomerTableProps {
  data: Customer[];
}

export function CustomerTable({ data }: CustomerTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Müşteri ara..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Kolonları Göster
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Müşteri bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Önceki
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
} 