"use client";

import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Minus } from "lucide-react";

export default function DividerComponent({ data = {}, onUpdate }) {
  const style = data.style || "solid";
  const color = data.color || "#e5e7eb";

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  return (
    <div className="block-component divider-component">
      <div className="block-header">
        <Minus size={16} />
        <span>Divider</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">Style</label>
          <Dropdown
            value={style}
            onChange={(e) => handleChange("style", e.value)}
            options={[
              { label: "Solid", value: "solid" },
              { label: "Dashed", value: "dashed" },
              { label: "Dotted", value: "dotted" },
            ]}
            className="w-full"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Color</label>
          <InputText
            value={color}
            onChange={(e) => handleChange("color", e.target.value)}
            placeholder="#e5e7eb"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

