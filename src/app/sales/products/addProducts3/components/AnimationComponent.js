"use client";

import { Dropdown } from "primereact/dropdown";
import { Film } from "lucide-react";

export default function AnimationComponent({ data = {}, onUpdate }) {
  const type = data.type || "fade";

  const handleChange = (value) => {
    onUpdate?.({ ...data, type: value });
  };

  return (
    <div className="block-component animation-component">
      <div className="block-header">
        <Film size={16} />
        <span>Animation</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">Animation Type</label>
          <Dropdown
            value={type}
            onChange={(e) => handleChange(e.value)}
            options={[
              { label: "Fade", value: "fade" },
              { label: "Slide Up", value: "slide-up" },
              { label: "Slide Down", value: "slide-down" },
              { label: "Slide Left", value: "slide-left" },
              { label: "Slide Right", value: "slide-right" },
              { label: "Zoom In", value: "zoom-in" },
              { label: "Zoom Out", value: "zoom-out" },
            ]}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

