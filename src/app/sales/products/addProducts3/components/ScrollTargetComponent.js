"use client";

import { InputText } from "primereact/inputtext";
import { MapPin } from "lucide-react";

export default function ScrollTargetComponent({ data = {}, onUpdate }) {
  const target = data.target || "";

  const handleChange = (value) => {
    onUpdate?.({ ...data, target: value });
  };

  return (
    <div className="block-component scroll-target-component">
      <div className="block-header">
        <MapPin size={16} />
        <span>Scroll Target</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">Target ID</label>
          <InputText
            value={target}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="target-id"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            ID elemen yang akan di-scroll ke sini
          </p>
        </div>
      </div>
    </div>
  );
}

