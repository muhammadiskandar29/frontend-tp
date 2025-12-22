"use client";

import { InputText } from "primereact/inputtext";
import { Minus } from "lucide-react";

export default function SectionComponent({ data = {}, onUpdate }) {
  const background = data.background || "#ffffff";
  const padding = data.padding || "20px";

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  return (
    <div className="block-component section-component">
      <div className="block-header">
        <Minus size={16} />
        <span>Section</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">Background Color</label>
          <InputText
            value={background}
            onChange={(e) => handleChange("background", e.target.value)}
            placeholder="#ffffff"
            className="w-full"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Padding</label>
          <InputText
            value={padding}
            onChange={(e) => handleChange("padding", e.target.value)}
            placeholder="20px"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

