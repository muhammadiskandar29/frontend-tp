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
    isExpanded = true,
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

  const handleHeaderClick = (e) => {
    // Hanya toggle jika klik bukan di button atau menu
    const clickedButton = e.target.closest('button');
    const clickedMenu = e.target.closest('.component-menu-wrapper');
    const clickedMoveButtons = e.target.closest('.component-move-buttons');
    
    // Jangan toggle jika klik di button atau menu
    if (clickedButton || clickedMenu || clickedMoveButtons) {
      return;
    }
    
    // Toggle expand/collapse
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[HEADER CLICK] Title:', title, 'isExpanded:', isExpanded, 'onToggleExpand exists:', !!onToggleExpand);
    
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      console.warn('[HEADER CLICK] onToggleExpand is not defined!');
    }
  };

  return (
    <div className="sidebar-component-card">
      {/* Header dengan arrow dan menu */}
      <div 
        className="component-card-header" 
        onClick={handleHeaderClick}
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
          <div className="component-expand-icon-wrapper">
            {isExpanded ? (
              <ChevronDown size={16} className="component-expand-icon" />
            ) : (
              <ChevronRight size={16} className="component-expand-icon" />
            )}
          </div>
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

