"use client";

import React from "react";

interface IconProps {
  icon: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

const Icon: React.FC<IconProps> = ({ icon, className = "", width, height }) => {
  return (
    <span
      className={`iconify ${className}`}
      data-icon={icon}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
    />
  );
};

export default Icon;
