"use client";

import { InputTextarea } from "primereact/inputtextarea";
import { Type } from "lucide-react";

export default function TextComponent({ data = {}, onUpdate }) {
  const content = data.content || "";

  const handleChange = (value) => {
    onUpdate?.({ ...data, content: value });
  };

  return (
    <div className="block-component text-component">
      <div className="block-header">
        <Type size={16} />
        <span>Teks</span>
      </div>
      <div className="block-content">
        <InputTextarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Masukkan teks deskripsi..."
          rows={5}
          className="w-full"
        />
      </div>
    </div>
  );
}

