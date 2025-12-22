"use client";

import { InputTextarea } from "primereact/inputtextarea";
import { Code } from "lucide-react";

export default function HTMLComponent({ data = {}, onUpdate }) {
  const code = data.code || "";

  const handleChange = (value) => {
    onUpdate?.({ ...data, code: value });
  };

  return (
    <div className="block-component html-component">
      <div className="block-header">
        <Code size={16} />
        <span>HTML</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">HTML Code</label>
          <InputTextarea
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Masukkan HTML code di sini"
            rows={8}
            className="w-full font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}

