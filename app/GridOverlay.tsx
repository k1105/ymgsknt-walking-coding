"use client";
import styles from "./GridOverlay.module.css";
export default function GridOverlay() {
  return (
    <div className={`fixed inset-0 pointer-events-none ${styles.grid}`}>
      {/* 6列のグリッドアイテム */}
      {Array.from({length: 6}).map((_, index) => (
        <div
          key={index}
          style={{
            borderLeft:
              index === 0 ? "1px solid rgba(135, 206, 250, 0.8)" : "none",
            borderRight: "1px solid rgba(135, 206, 250, 0.8)",
            backgroundColor: "white",
            minHeight: "100vh",
          }}
        />
      ))}
    </div>
  );
}
