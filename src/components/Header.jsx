// Header 컴포넌트 — 탭 네비게이션 + 관리자 드롭다운
import { useState, useEffect, useRef } from "react";
import { C, TODAY, WEEKDAYS, menuItemStyle } from "../constants.js";

export function Header({ tab, setTab, onAddStudent, onLogout, onChangePw }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const tabs = [
    { id: "attendance", label: "출석부",  icon: "✏️" },
    { id: "payment",    label: "수강료",  icon: "💰" },
    { id: "students",   label: "학생목록", icon: "👥" },
    { id: "staff",      label: "출근부",  icon: "👩‍🏫" },
  ];

  return (
    <header style={{
      background: C.surface,
      borderBottom: `2px solid ${C.accent}`,
      position: "sticky", top: 0, left: 0, zIndex: 100,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🎨</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: C.ink }}>미술학원 관리</span>
            </div>
            <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>
              {TODAY.getFullYear()}년 {TODAY.getMonth() + 1}월 {TODAY.getDate()}일 ({WEEKDAYS[TODAY.getDay()]})
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onAddStudent}
              style={{
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 14,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              + 학생 추가
            </button>

            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  background: menuOpen ? C.bg : "transparent",
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: "8px 10px", fontSize: 18, color: C.inkMuted,
                }}
              >
                ⚙️
              </button>

              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  minWidth: 170, zIndex: 300, overflow: "hidden",
                }}>
                  <div style={{ padding: "8px 14px 6px", fontSize: 11, fontWeight: 700, color: C.inkMuted, borderBottom: `1px solid ${C.border}` }}>
                    🔐 관리자
                  </div>
                  <button onClick={() => { setMenuOpen(false); onChangePw(); }} style={menuItemStyle}>
                    🔑 비밀번호 변경
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    style={{ ...menuItemStyle, color: C.accent, borderTop: `1px solid ${C.border}` }}
                  >
                    🔒 잠금 (로그아웃)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 2, paddingTop: 8 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "9px 2px", border: "none", background: "transparent",
                borderBottom: tab === t.id ? `3px solid ${C.accent}` : "3px solid transparent",
                color: tab === t.id ? C.accent : C.inkMuted,
                fontWeight: tab === t.id ? 700 : 500, fontSize: 12, transition: "all 0.15s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
