"use client";

import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import ComponentWrapper from "./ComponentWrapper";

export default function ButtonComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index, isExpanded, onToggleExpand }) {
  const text = data.text || "Klik Disini";
  const link = data.link || "#";
  const style = data.style || "primary";

  const handleChange = (field, value) => {
    onUpdate?.({ ...data, [field]: value });
  };

  return (
    <ComponentWrapper
      title="Tombol"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <div className="button-component-content">
        <div className="form-field-group">
          <label className="form-label-small">Text Tombol</label>
          <InputText
            value={text}
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="Klik Disini"
            className="w-full form-input"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Link / URL</label>
          <InputText
            value={link}
            onChange={(e) => handleChange("link", e.target.value)}
            placeholder="#"
            className="w-full form-input"
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
    </ComponentWrapper>
  );
}

