"use client";

import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Square } from "lucide-react";

export default function ButtonComponent({ data = {}, onUpdate }) {
  const text = data.text || "Klik Disini";
  const link = data.link || "#";
  const style = data.style || "primary";

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  return (
    <div className="block-component button-component">
      <div className="block-header">
        <Square size={16} />
        <span>Tombol</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">Text Tombol</label>
          <InputText
            value={text}
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="Text tombol"
            className="w-full"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Link / URL</label>
          <InputText
            value={link}
            onChange={(e) => handleChange("link", e.target.value)}
            placeholder="https://..."
            className="w-full"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Style</label>
          <Dropdown
            value={style}
            onChange={(e) => handleChange("style", e.value)}
            options={[
              { label: "Primary", value: "primary" },
              { label: "Secondary", value: "secondary" },
              { label: "Success", value: "success" },
              { label: "Danger", value: "danger" },
            ]}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

