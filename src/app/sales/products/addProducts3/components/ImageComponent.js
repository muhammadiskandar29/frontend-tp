"use client";

import { InputText } from "primereact/inputtext";
import { Image as ImageIcon } from "lucide-react";

export default function ImageComponent({ data = {}, onUpdate }) {
  const src = data.src || "";
  const alt = data.alt || "";
  const caption = data.caption || "";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdate?.({ ...data, src: event.target.result, file: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  return (
    <div className="block-component image-component">
      <div className="block-header">
        <ImageIcon size={16} />
        <span>Gambar</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">Upload Gambar</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
        
        {src && (
          <div className="image-preview">
            <img src={src} alt={alt || "Preview"} className="preview-image" />
          </div>
        )}

        <div className="form-field-group">
          <label className="form-label-small">Alt Text</label>
          <InputText
            value={alt}
            onChange={(e) => handleChange("alt", e.target.value)}
            placeholder="Deskripsi gambar"
            className="w-full"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Caption</label>
          <InputText
            value={caption}
            onChange={(e) => handleChange("caption", e.target.value)}
            placeholder="Caption gambar (opsional)"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

