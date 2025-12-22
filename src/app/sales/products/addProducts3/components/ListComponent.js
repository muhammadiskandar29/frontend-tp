"use client";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { List, Trash2 } from "lucide-react";

export default function ListComponent({ data = {}, onUpdate }) {
  const items = data.items || [];

  const addItem = () => {
    const newItems = [...items, { nama: "" }];
    onUpdate?.({ ...data, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate?.({ ...data, items: newItems });
  };

  const updateItem = (index, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], nama: value };
    onUpdate?.({ ...data, items: newItems });
  };

  return (
    <div className="block-component list-component">
      <div className="block-header">
        <List size={16} />
        <span>Daftar / List Point</span>
      </div>
      <div className="block-content">
        {items.map((item, index) => (
          <div key={index} className="list-item-editor">
            <div className="list-item-number">{index + 1}</div>
            <InputText
              value={item.nama}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={`Point ${index + 1}`}
              className="flex-1"
            />
            <Button
              icon={<Trash2 size={14} />}
              severity="danger"
              size="small"
              onClick={() => removeItem(index)}
            />
          </div>
        ))}

        <Button
          label="Tambah Point"
          icon="pi pi-plus"
          size="small"
          onClick={addItem}
          className="add-item-btn"
        />
      </div>
    </div>
  );
}

