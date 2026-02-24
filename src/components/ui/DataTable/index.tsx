/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  headerAlign?: "left" | "center" | "right";
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  hoverable?: boolean;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data found",
  hoverable = true,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-lg border border-black overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b border-black">
            <tr>
              {columns.map((column, index) => {
                const alignClass = column.headerAlign === "center"
                  ? "text-center"
                  : column.headerAlign === "right"
                  ? "text-right"
                  : "text-left";

                return (
                  <th
                    key={index}
                    className={`px-4 py-3 ${alignClass} text-sm font-semibold text-gray-900 uppercase ${
                      index < columns.length - 1 ? "border-r border-black" : ""
                    } ${column.className || ""}`}
                  >
                    {column.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={keyExtractor(item, rowIndex)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`
                    ${hoverable ? "hover:bg-gray-50" : ""} 
                    ${onRowClick ? "cursor-pointer" : ""}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3 text-sm ${
                        colIndex < columns.length - 1 ? "border-r border-black" : ""
                      } ${column.className || ""}`}
                    >
                      {column.render
                        ? column.render(item, rowIndex)
                        : String((item as any)[column.key] || "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
