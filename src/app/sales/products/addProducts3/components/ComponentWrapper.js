"use client";

import { ChevronUp, ChevronDown, MoreVertical } from "lucide-react";

export default function ComponentWrapper({ 
  title, 
  children, 
  index, 
  onMoveUp, 
  onMoveDown, 
  onDelete 
}) {
  return (
    <div className="sidebar-component-card">
      {/* Header dengan arrow dan menu */}
      <div className="component-card-header">
        <div className="component-card-header-left">
          <button 
            className="component-move-btn" 
            onClick={onMoveUp} 
            disabled={index === 0}
            title="Pindah ke atas"
          >
            <ChevronUp size={16} />
          </button>
          <button 
            className="component-move-btn" 
            onClick={onMoveDown}
            title="Pindah ke bawah"
          >
            <ChevronDown size={16} />
          </button>
          <span className="component-card-title">{title}</span>
        </div>
        <button 
          className="component-menu-btn"
          onClick={onDelete}
          title="Hapus komponen"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="component-card-content">
        {children}
      </div>
    </div>
  );
}

