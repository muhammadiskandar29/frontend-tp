"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Clock } from "lucide-react";
import ComponentWrapper from "./ComponentWrapper";

export default function CountdownComponent({ data = {}, onUpdate, onMoveUp, onMoveDown, onDelete, index, isExpanded, onToggleExpand }) {
  const hours = data.hours || 2;
  const minutes = data.minutes || 0;
  const seconds = data.seconds || 0;
  const promoText = data.promoText || "Promo Berakhir Dalam:";
  const textColor = data.textColor || "#e5e7eb";
  const bgColorHours = data.bgColorHours || "#1f2937";
  const bgColorMinutes = data.bgColorMinutes || "#1f2937";
  const bgColorSeconds = data.bgColorSeconds || "#1f2937";
  const numberStyle = data.numberStyle || "flip"; // flip, simple, modern
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const handleChange = (field, value) => {
    flushSync(() => {
      onUpdate?.({ ...data, [field]: value });
    });
    // Reset countdown when time settings change
    if (field === 'hours' || field === 'minutes' || field === 'seconds') {
      resetCountdown();
    }
  };

  // Calculate total seconds
  const getTotalSeconds = () => {
    return (hours * 3600) + (minutes * 60) + seconds;
  };

  // Initialize countdown
  const initializeCountdown = () => {
    const totalSeconds = getTotalSeconds();
    if (totalSeconds <= 0) return;

    // Check if there's a saved end time in localStorage
    const storageKey = `countdown_${index || 'default'}`;
    const savedEndTime = localStorage.getItem(storageKey);
    const now = Date.now();
    
    let endTime;
    
    if (savedEndTime) {
      const savedTime = parseInt(savedEndTime);
      const elapsed = now - savedTime;
      const remaining = (totalSeconds * 1000) - elapsed;
      
      if (remaining > 0) {
        // Continue from saved time
        endTime = savedTime + (totalSeconds * 1000);
      } else {
        // Time expired, reset
        endTime = now + (totalSeconds * 1000);
        localStorage.setItem(storageKey, now.toString());
      }
    } else {
      // First time, start new countdown
      endTime = now + (totalSeconds * 1000);
      localStorage.setItem(storageKey, now.toString());
    }
    
    startTimeRef.current = endTime - (totalSeconds * 1000);
    updateTimeLeft(endTime);
  };

  // Reset countdown
  const resetCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const totalSeconds = getTotalSeconds();
    if (totalSeconds <= 0) return;
    
    const storageKey = `countdown_${index || 'default'}`;
    const now = Date.now();
    const endTime = now + (totalSeconds * 1000);
    localStorage.setItem(storageKey, now.toString());
    startTimeRef.current = now;
    updateTimeLeft(endTime);
  };

  // Update time left
  const updateTimeLeft = (endTime) => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    
    if (remaining <= 0) {
      // Countdown finished, reset
      resetCountdown();
      return;
    }
    
    const hrs = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remaining % (1000 * 60)) / 1000);
    
    setTimeLeft({ hours: hrs, minutes: mins, seconds: secs });
  };

  // Format time for display (02:00:00)
  const formatTime = (time) => {
    return {
      hours: String(time.hours).padStart(2, '0'),
      minutes: String(time.minutes).padStart(2, '0'),
      seconds: String(time.seconds).padStart(2, '0')
    };
  };

  useEffect(() => {
    initializeCountdown();
    
    // Update every second
    intervalRef.current = setInterval(() => {
      const totalSeconds = getTotalSeconds();
      if (totalSeconds <= 0) return;
      
      const storageKey = `countdown_${index || 'default'}`;
      const savedEndTime = localStorage.getItem(storageKey);
      if (!savedEndTime) {
        resetCountdown();
        return;
      }
      
      const startTime = parseInt(savedEndTime);
      const endTime = startTime + (totalSeconds * 1000);
      updateTimeLeft(endTime);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hours, minutes, seconds, index]);

  const formattedTime = formatTime(timeLeft);

  // Render number based on style
  const renderNumber = (value, bgColor) => {
    if (numberStyle === "flip") {
      return (
        <div style={{
          backgroundColor: bgColor,
          borderRadius: "8px",
          padding: "16px 24px",
          position: "relative",
          boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)",
          minWidth: "80px",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: textColor,
            fontFamily: "monospace",
            lineHeight: "1",
            position: "relative",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)"
          }}>
            {value}
            {/* Flip clock divider line */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              transform: "translateY(-50%)"
            }} />
          </div>
        </div>
      );
    } else if (numberStyle === "modern") {
      return (
        <div style={{
          backgroundColor: bgColor,
          borderRadius: "12px",
          padding: "20px 28px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          minWidth: "80px",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: textColor,
            fontFamily: "monospace",
            lineHeight: "1"
          }}>
            {value}
          </div>
        </div>
      );
    } else {
      // Simple style
      return (
        <div style={{
          backgroundColor: bgColor,
          borderRadius: "8px",
          padding: "16px 24px",
          minWidth: "80px",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: textColor,
            fontFamily: "monospace",
            lineHeight: "1"
          }}>
            {value}
          </div>
        </div>
      );
    }
  };

  return (
    <ComponentWrapper
      title="Countdown"
      index={index}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onDelete={onDelete}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      <div className="countdown-component-content">
        <div className="form-field-group">
          <label className="form-label-small">Text Promo</label>
          <InputText
            value={promoText}
            onChange={(e) => handleChange("promoText", e.target.value)}
            placeholder="Promo Berakhir Dalam:"
            className="w-full form-input"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Durasi Countdown</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Jam</label>
              <InputNumber
                value={hours}
                onValueChange={(e) => handleChange("hours", e.value || 0)}
                min={0}
                max={23}
                className="w-full"
                showButtons
                buttonLayout="horizontal"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Menit</label>
              <InputNumber
                value={minutes}
                onValueChange={(e) => handleChange("minutes", e.value || 0)}
                min={0}
                max={59}
                className="w-full"
                showButtons
                buttonLayout="horizontal"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", display: "block" }}>Detik</label>
              <InputNumber
                value={seconds}
                onValueChange={(e) => handleChange("seconds", e.value || 0)}
                min={0}
                max={59}
                className="w-full"
                showButtons
                buttonLayout="horizontal"
              />
            </div>
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Style Angka</label>
          <Dropdown
            value={numberStyle}
            onChange={(e) => handleChange("numberStyle", e.value)}
            options={[
              { label: "Flip Clock", value: "flip" },
              { label: "Modern", value: "modern" },
              { label: "Simple", value: "simple" },
            ]}
            className="w-full"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Warna Angka</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="color"
              value={textColor}
              onChange={(e) => handleChange("textColor", e.target.value)}
              style={{ width: "50px", height: "40px", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer" }}
            />
            <InputText
              value={textColor}
              onChange={(e) => handleChange("textColor", e.target.value)}
              placeholder="#e5e7eb"
              className="form-input"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Background Jam</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="color"
              value={bgColorHours}
              onChange={(e) => handleChange("bgColorHours", e.target.value)}
              style={{ width: "50px", height: "40px", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer" }}
            />
            <InputText
              value={bgColorHours}
              onChange={(e) => handleChange("bgColorHours", e.target.value)}
              placeholder="#1f2937"
              className="form-input"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Background Menit</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="color"
              value={bgColorMinutes}
              onChange={(e) => handleChange("bgColorMinutes", e.target.value)}
              style={{ width: "50px", height: "40px", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer" }}
            />
            <InputText
              value={bgColorMinutes}
              onChange={(e) => handleChange("bgColorMinutes", e.target.value)}
              placeholder="#1f2937"
              className="form-input"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Background Detik</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="color"
              value={bgColorSeconds}
              onChange={(e) => handleChange("bgColorSeconds", e.target.value)}
              style={{ width: "50px", height: "40px", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer" }}
            />
            <InputText
              value={bgColorSeconds}
              onChange={(e) => handleChange("bgColorSeconds", e.target.value)}
              placeholder="#1f2937"
              className="form-input"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label-small">Preview Countdown</label>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "transparent",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <div style={{ color: "#374151", fontSize: "14px", marginBottom: "16px", fontWeight: "500" }}>
              {promoText}
            </div>
            <div style={{ 
              display: "flex", 
              gap: "12px", 
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              {renderNumber(formattedTime.hours, bgColorHours)}
              <span style={{ fontSize: "32px", color: "#6b7280", fontWeight: "bold" }}>:</span>
              {renderNumber(formattedTime.minutes, bgColorMinutes)}
              <span style={{ fontSize: "32px", color: "#6b7280", fontWeight: "bold" }}>:</span>
              {renderNumber(formattedTime.seconds, bgColorSeconds)}
            </div>
            <div style={{ 
              display: "flex", 
              gap: "80px", 
              justifyContent: "center",
              marginTop: "12px",
              fontSize: "12px",
              color: "#6b7280",
              fontWeight: "500"
            }}>
              <span>Jam</span>
              <span>Menit</span>
              <span>Detik</span>
            </div>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  );
}
