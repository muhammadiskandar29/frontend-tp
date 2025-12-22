"use client";

import { InputTextarea } from "primereact/inputtextarea";
import { Link as LinkIcon } from "lucide-react";

export default function EmbedComponent({ data = {}, onUpdate }) {
  const code = data.code || "";

  const handleChange = (value) => {
    onUpdate?.({ ...data, code: value });
  };

  return (
    <div className="block-component embed-component">
      <div className="block-header">
        <LinkIcon size={16} />
        <span>Embed</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">Embed Code (HTML)</label>
          <InputTextarea
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Paste embed code di sini (iframe, script, dll)"
            rows={5}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

