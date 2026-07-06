// 학생 목록 탭 — 검색 + 반별 그룹 카드 리스트 (2열 그리드)
import { useState } from "react";
import { C } from "../constants.js";
import { EmptyState } from "./ui.jsx";

const CLASS_TYPES = ["유치부", "초등부", "중고등부", "성인반"];

export function StudentsTab({ students, onSelectStudent }) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("전체");
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const filtered = students
    .filter((s) => (showWithdrawn ? s.status === "withdrawn" : s.status !== "withdrawn"))
    .filter((s) => s.name.includes(search) || s.grade.includes(search));
  const visibleTypes = activeType === "전체" ? CLASS_TYPES : [activeType];
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 학년 검색"
          style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, background: C.surface, outline: "none" }}
        />
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.inkMuted }}>🔍</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {["전체", ...CLASS_TYPES].map((ct) => {
            const active = activeType === ct;
            return (
              <button
                key={ct}
                onClick={() => setActiveType(ct)}
                style={{
                  padding: "8px 14px", borderRadius: 20, whiteSpace: "nowrap",
                  border: "1px solid " + (active ? C.accent : C.border),
                  background: active ? C.accent : "transparent",
                  color: active ? "#fff" : C.inkMuted,
                  fontWeight: 600, fontSize: 13, flexShrink: 0,
                }}
              >
                {ct}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: C.inkMuted, fontWeight: 600 }}>
            총 {filtered.length}명
          </span>
          <button
            onClick={() => setShowWithdrawn((v) => !v)}
            style={{
              fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 14,
              border: `1px solid ${showWithdrawn ? C.accent : C.border}`,
              background: showWithdrawn ? C.accentLight : "transparent",
              color: showWithdrawn ? C.accent : C.inkMuted,
              whiteSpace: "nowrap",
            }}
          >
            {showWithdrawn ? "← 재원생 보기" : "퇴원생 보기"}
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <EmptyState text="검색 결과가 없습니다." />
        </div>
      ) : (
        visibleTypes.map((ct) => {
          const group = filtered.filter((s) => (s.classType || "초등부") === ct);
          if (group.length === 0) return null;

          return (
            <div key={ct} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{ct}</span>
                <span style={{ fontSize: 12, color: C.inkMuted }}>{group.length}명</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {group.map((s) => (
                  <StudentRow key={s.id} student={s} onSelect={onSelectStudent} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function StudentRow({ student, onSelect }) {
  const info = `${student.grade} · ${student.days.join(",")} · ${student.type}${student.type === "횟수제" ? ` (${student.usedSessions}/${student.totalSessions}회)` : ""}`;
  return (
    <div
      onClick={() => onSelect(student)}
      style={{ display: "flex", alignItems: "center", padding: "14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", gap: 8, minWidth: 0 }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", rowGap: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: C.ink }}>{student.name}</span>
        <span style={{ fontSize: 13, color: C.inkMuted }}>{info}</span>
      </div>
      <span style={{ color: C.border, fontSize: 18, flexShrink: 0 }}>›</span>
    </div>
  );
}
