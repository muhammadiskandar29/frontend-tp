"use client";

import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Trash2 } from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

export default function FAQComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index }) {
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
    <ComponentWrapper
      title="FAQ"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
    >
      <div className="faq-component-content">
        {items.map((item, i) => (
          <div key={i} className="faq-item-editor">
            <div className="faq-item-header">
              <span>FAQ {i + 1}</span>
              <Button
                icon={<Trash2 size={14} />}
                severity="danger"
                size="small"
                onClick={() => removeFAQ(i)}
              />
            </div>

            <div className="form-field-group">
              <label className="form-label-small">Pertanyaan</label>
              <InputText
                value={item.question}
                onChange={(e) => updateFAQ(i, "question", e.target.value)}
                placeholder="Masukkan pertanyaan"
                className="w-full form-input"
              />
            </div>

            <div className="form-field-group">
              <label className="form-label-small">Jawaban</label>
              <InputTextarea
                value={item.answer}
                onChange={(e) => updateFAQ(i, "answer", e.target.value)}
                placeholder="Masukkan jawaban"
                rows={3}
                className="w-full form-input"
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
    </ComponentWrapper>
  );
}

