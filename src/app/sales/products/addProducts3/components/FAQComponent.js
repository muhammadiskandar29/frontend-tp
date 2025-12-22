"use client";

import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { HelpCircle, Trash2 } from "lucide-react";

export default function FAQComponent({ data = {}, onUpdate }) {
  const items = data.items || [];

  const addFAQ = () => {
    const newItems = [...items, { question: "", answer: "" }];
    onUpdate?.({ ...data, items: newItems });
  };

  const removeFAQ = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate?.({ ...data, items: newItems });
  };

  const updateFAQ = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate?.({ ...data, items: newItems });
  };

  return (
    <div className="block-component faq-component">
      <div className="block-header">
        <HelpCircle size={16} />
        <span>FAQ</span>
      </div>
      <div className="block-content">
        {items.map((item, index) => (
          <div key={index} className="faq-item-editor">
            <div className="faq-item-header">
              <span>FAQ {index + 1}</span>
              <Button
                icon={<Trash2 size={14} />}
                severity="danger"
                size="small"
                onClick={() => removeFAQ(index)}
              />
            </div>

            <div className="form-field-group">
              <label className="form-label-small">Pertanyaan</label>
              <InputText
                value={item.question}
                onChange={(e) => updateFAQ(index, "question", e.target.value)}
                placeholder="Masukkan pertanyaan"
                className="w-full"
              />
            </div>

            <div className="form-field-group">
              <label className="form-label-small">Jawaban</label>
              <InputTextarea
                value={item.answer}
                onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                placeholder="Masukkan jawaban"
                rows={3}
                className="w-full"
              />
            </div>
          </div>
        ))}

        <Button
          label="Tambah FAQ"
          icon="pi pi-plus"
          size="small"
          onClick={addFAQ}
          className="add-item-btn"
        />
      </div>
    </div>
  );
}

