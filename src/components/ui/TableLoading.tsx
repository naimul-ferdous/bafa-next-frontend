"use client";

import React from "react";
import { Icon } from "@iconify/react";

export default function TableLoading() {
  return (
    <div className="w-full min-h-[20vh] flex items-center justify-center">
      <div>
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
      </div>
    </div>
  );
}
