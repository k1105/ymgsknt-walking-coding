"use client";

export default function GridOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "16px",
        padding: "0",
        backgroundColor: "rgba(173, 216, 230, 0.5)", // 水色の背景（gap部分と全体）
      }}
    >
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
