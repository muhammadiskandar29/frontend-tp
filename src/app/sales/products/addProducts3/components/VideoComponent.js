"use client";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Trash2, Info } from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

export default function VideoComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index, isExpanded, onToggleExpand }) {
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
      title="Video"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      {/* Info Box */}
      <div className="component-info-box" style={{ 
        padding: '12px 14px', 
        background: '#f0f9ff', 
        borderRadius: '8px',
        border: '1px solid #bae6fd',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <Info size={16} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ 
          margin: 0, 
          fontSize: '13px', 
          color: '#0c4a6e',
          lineHeight: '1.5'
        }}>
          <strong>Info:</strong> Video berupa link YouTube. Contoh: https://youtube.com/watch?v=...
        </p>
      </div>

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

