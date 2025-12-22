"use client";

import { InputText } from "primereact/inputtext";
import { Youtube } from "lucide-react";

export default function VideoComponent({ data = {}, onUpdate }) {
  const url = data.url || "";

  const handleChange = (value) => {
    // Convert YouTube watch URL to embed URL
    let embedUrl = value;
    if (embedUrl.includes("watch?v=")) {
      embedUrl = embedUrl.replace("watch?v=", "embed/");
    }
    if (embedUrl.includes("youtu.be/")) {
      embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
    }
    
    onUpdate?.({ ...data, url: value, embedUrl: embedUrl });
  };

  return (
    <div className="block-component video-component">
      <div className="block-header">
        <Youtube size={16} />
        <span>Video YouTube</span>
      </div>
      <div className="block-content">
        <div className="form-field-group">
          <label className="form-label-small">URL Video YouTube</label>
          <InputText
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full"
          />
        </div>
        
        {data.embedUrl && (
          <div className="video-preview">
            <iframe
              src={data.embedUrl}
              title="Video Preview"
              allowFullScreen
              className="preview-iframe"
            />
          </div>
        )}
      </div>
    </div>
  );
}

