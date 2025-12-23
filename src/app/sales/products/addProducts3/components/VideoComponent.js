"use client";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Trash2 } from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

export default function VideoComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index }) {
  const items = data.items || [];

  const addVideo = () => {
    const newItems = [...items, { url: "" }];
    onUpdate?.({ ...data, items: newItems });
  };

  const removeVideo = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate?.({ ...data, items: newItems });
  };

  const updateVideo = (index, value) => {
    const newItems = [...items];
    // Convert YouTube watch URL to embed URL
    let embedUrl = value;
    if (embedUrl.includes("watch?v=")) {
      embedUrl = embedUrl.replace("watch?v=", "embed/");
    }
    if (embedUrl.includes("youtu.be/")) {
      embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
    }
    newItems[index] = { ...newItems[index], url: value, embedUrl: embedUrl };
    onUpdate?.({ ...data, items: newItems });
  };

  return (
    <ComponentWrapper
      title="Video YouTube"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
    >
      <div className="video-component-content">
        {items.map((item, i) => (
          <div key={i} className="video-item-card">
            <div className="video-item-header">
              <span className="video-item-number">Video {i + 1}</span>
              <Button
                icon={<Trash2 size={14} />}
                severity="danger"
                size="small"
                onClick={() => removeVideo(i)}
                tooltip="Hapus video"
              />
            </div>
            <div className="video-item-content">
              <div className="form-field-group">
                <label className="form-label-small">Link YouTube</label>
                <InputText
                  value={item.url}
                  onChange={(e) => updateVideo(i, e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full form-input"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          icon="pi pi-plus"
          label="Tambah Link"
          onClick={addVideo}
          className="add-item-btn"
        />
      </div>
    </ComponentWrapper>
  );
}

