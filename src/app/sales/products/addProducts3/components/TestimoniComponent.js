"use client";

import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { MessageSquare, Trash2 } from "lucide-react";

export default function TestimoniComponent({ data = {}, onUpdate }) {
  const items = data.items || [];

  const addTestimoni = () => {
    const newItems = [...items, { nama: "", deskripsi: "", gambar: null }];
    onUpdate?.({ ...data, items: newItems });
  };

  const removeTestimoni = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate?.({ ...data, items: newItems });
  };

  const updateTestimoni = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate?.({ ...data, items: newItems });
  };

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateTestimoni(index, "gambar", event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="block-component testimoni-component">
      <div className="block-header">
        <MessageSquare size={16} />
        <span>Testimoni</span>
      </div>
      <div className="block-content">
        {items.map((item, index) => (
          <div key={index} className="testimoni-item-editor">
            <div className="testimoni-item-header">
              <span>Testimoni {index + 1}</span>
              <Button
                icon={<Trash2 size={14} />}
                severity="danger"
                size="small"
                onClick={() => removeTestimoni(index)}
              />
            </div>
            
            <div className="form-field-group">
              <label className="form-label-small">Upload Foto</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(index, e)}
                className="file-input"
              />
              {item.gambar && (
                <div className="image-preview-small">
                  <img src={item.gambar} alt={`Testimoni ${index + 1}`} />
                </div>
              )}
            </div>

            <div className="form-field-group">
              <label className="form-label-small">Nama</label>
              <InputText
                value={item.nama}
                onChange={(e) => updateTestimoni(index, "nama", e.target.value)}
                placeholder="Nama testimoni"
                className="w-full"
              />
            </div>

            <div className="form-field-group">
              <label className="form-label-small">Deskripsi</label>
              <InputTextarea
                value={item.deskripsi}
                onChange={(e) => updateTestimoni(index, "deskripsi", e.target.value)}
                placeholder="Deskripsi testimoni"
                rows={3}
                className="w-full"
              />
            </div>
          </div>
        ))}

        <Button
          label="Tambah Testimoni"
          icon="pi pi-plus"
          size="small"
          onClick={addTestimoni}
          className="add-item-btn"
        />
      </div>
    </div>
  );
}

