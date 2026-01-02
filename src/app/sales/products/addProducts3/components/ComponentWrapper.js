"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, ChevronRight, MoreVertical } from "lucide-react";

export default function ComponentWrapper({ 
  title, 
  children, 
  index, 
  onMoveUp, 
  onMoveDown, 
  onDelete,
    isExpanded = false,
  onToggleExpand,
  isRequired = false
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="sidebar-component-card">
      {/* Header dengan arrow dan menu */}
      <div 
        className="component-card-header" 
        onClick={() => {
          if (onToggleExpand) {
            onToggleExpand();
          }
        }}
      >
        <div className="component-card-header-left">
          <div className="component-move-buttons">
            <button 
              className={`component-move-btn-up ${index === 0 ? 'disabled' : ''}`}
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              disabled={index === 0}
              title="Pindah ke atas"
            >
              <ChevronUp size={14} />
            </button>
            <button 
              className="component-move-btn-down"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              title="Pindah ke bawah"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          {isExpanded ? (
            <ChevronDown size={16} className="component-expand-icon" />
          ) : (
            <ChevronRight size={16} className="component-expand-icon" />
          )}
          <span className="component-card-title">{title}</span>
        </div>
        <div className="component-menu-wrapper" ref={menuRef}>
          <button 
            className="component-menu-btn"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            title="Menu"
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <div className="component-menu-dropdown">
              <button className="menu-item" onClick={() => { setShowMenu(false); }}>
                Duplikat
              </button>
              {!isRequired && (
                <button className="menu-item menu-item-danger" onClick={() => { setShowMenu(false); onDelete(); }}>
                  Hapus
                </button>
              )}
              {isRequired && (
                <button className="menu-item menu-item-disabled" disabled>
                  Hapus (Tidak bisa dihapus)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="component-card-content">
          {children}
        </div>
      )}
    </div>
  );
}

