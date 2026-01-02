"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { InputText } from "primereact/inputtext";

export default function SimpleColorPicker({ 
  value = "#ffffff", 
  onChange, 
  presetColors = [],
  label = "Pilih Warna"
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [alpha, setAlpha] = useState(1);
  const pickerRef = useRef(null);

  // Convert hex to HSB
  useEffect(() => {
    if (value && value.startsWith("#")) {
      const rgb = hexToRgb(value);
      if (rgb) {
        const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
        setHue(hsb.h);
        setSaturation(hsb.s);
        setBrightness(hsb.b);
      }
    }
  }, [value]);

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Convert RGB to HSB
  const rgbToHsb = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }
    return { h: h * 360, s: s * 100, b: v * 100 };
  };

  // Convert HSB to RGB
  const hsbToRgb = (h, s, b) => {
    h /= 360;
    s /= 100;
    b /= 100;
    const k = (n) => (n + h * 12) % 12;
    const a = s * Math.min(b, 1 - b);
    const f = (n) => b - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const bl = Math.round(255 * f(4));
    return { r, g, b: bl };
  };

  // Convert RGB to Hex
  const rgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  // Get current color from HSB
  const getCurrentColor = () => {
    const rgb = hsbToRgb(hue, saturation, brightness);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  // Handle saturation/brightness square interaction
  const handleSquareInteraction = (e, isMouseMove = false) => {
    if (!isMouseMove && e.type !== 'mousedown' && e.type !== 'click') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const newSaturation = Math.round((x / rect.width) * 100);
    const newBrightness = Math.round(100 - (y / rect.height) * 100);
    setSaturation(newSaturation);
    setBrightness(newBrightness);
    const rgb = hsbToRgb(hue, newSaturation, newBrightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange?.(hex);
  };

  // Handle hue slider interaction
  const handleHueInteraction = (e, isMouseMove = false) => {
    if (!isMouseMove && e.type !== 'mousedown' && e.type !== 'click') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newHue = Math.round((x / rect.width) * 360);
    setHue(newHue);
    const rgb = hsbToRgb(newHue, saturation, brightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onChange?.(hex);
  };

  // Handle alpha slider interaction
  const handleAlphaInteraction = (e, isMouseMove = false) => {
    if (!isMouseMove && e.type !== 'mousedown' && e.type !== 'click') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newAlpha = Math.round((x / rect.width) * 100) / 100;
    setAlpha(newAlpha);
  };

  // Handle hex input
  const handleHexChange = (e) => {
    const hex = e.target.value;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(hex) || hex === "") {
      if (hex.length === 7) {
        onChange?.(hex);
      }
    }
  };

  // Handle preset color click
  const handlePresetClick = (color) => {
    onChange?.(color);
    setShowPicker(false);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const currentColor = getCurrentColor();
  const hueColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className="simple-color-picker-wrapper" ref={pickerRef}>
      {/* Color Swatches Row */}
      {presetColors.length > 0 && (
        <div className="simple-color-swatches">
          {presetColors.filter(c => c && (c.startsWith("#") || c === "transparent")).map((color, idx) => (
            <button
              key={idx}
              className={`simple-color-swatch ${value === color ? "selected" : ""}`}
              style={{ 
                background: color === "transparent" ? "repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 10px 10px" : color,
                border: value === color ? "2px solid #3b82f6" : "1px solid #e5e7eb"
              }}
              onClick={() => handlePresetClick(color)}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Color Picker Modal */}
      {showPicker && (
        <div className="simple-color-picker-modal">
          <div className="simple-color-picker-header">
            <span>{label}</span>
            <button
              className="simple-color-picker-close"
              onClick={() => setShowPicker(false)}
            >
              <X size={16} />
            </button>
          </div>

          {/* Saturation/Brightness Square */}
          <div 
            className="simple-color-square"
            style={{
              background: `linear-gradient(to right, white, ${hueColor}), linear-gradient(to top, black, transparent)`
            }}
            onMouseDown={(e) => {
              handleSquareInteraction(e);
              const handleMove = (moveE) => handleSquareInteraction(moveE, true);
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
            onClick={(e) => handleSquareInteraction(e)}
          >
            <div
              className="simple-color-handle"
              style={{
                left: `${saturation}%`,
                top: `${100 - brightness}%`,
                transform: "translate(-50%, -50%)"
              }}
            />
          </div>

          {/* Hue Slider */}
          <div 
            className="simple-color-hue-slider"
            onMouseDown={(e) => {
              handleHueInteraction(e);
              const handleMove = (moveE) => handleHueInteraction(moveE, true);
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
            onClick={(e) => handleHueInteraction(e)}
          >
            <div
              className="simple-color-slider-handle"
              style={{
                left: `${(hue / 360) * 100}%`,
                transform: "translateX(-50%)"
              }}
            />
          </div>

          {/* Alpha Slider */}
          <div 
            className="simple-color-alpha-slider"
            style={{
              background: `linear-gradient(to right, transparent, ${currentColor})`,
              backgroundImage: `repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 10px 10px`
            }}
            onMouseDown={(e) => {
              handleAlphaInteraction(e);
              const handleMove = (moveE) => handleAlphaInteraction(moveE, true);
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
            onClick={(e) => handleAlphaInteraction(e)}
          >
            <div
              className="simple-color-slider-handle"
              style={{
                left: `${alpha * 100}%`,
                transform: "translateX(-50%)"
              }}
            />
          </div>

          {/* Hex Input */}
          <div className="simple-color-hex-input-wrapper">
            <InputText
              value={value || "#ffffff"}
              onChange={handleHexChange}
              placeholder="#ffffff"
              className="simple-color-hex-input"
            />
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        className="simple-color-picker-trigger"
        onClick={() => setShowPicker(!showPicker)}
        style={{ backgroundColor: value || "#ffffff" }}
      >
        <span className="simple-color-picker-hex">{value || "#ffffff"}</span>
      </button>
    </div>
  );
}

