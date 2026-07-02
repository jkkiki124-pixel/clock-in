// 학생 목록 탭 — 검색 + 반별 그룹 카드 리스트
import { useState } from "react";
import { C, TODAY } from "../constants.js";
import { Badge, EmptyState } from "./ui.jsx";

const CLASS_TYPES = ["유치부", "초등부", "중고등부", "성인반"];

export function StudentsTab({ students, onSelectStudent }) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("전체");
  const currentMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
  const filtered = students.filter((s) => s.name.includes(search) || s.grade.includes(search));
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
        <span style={{ fontSize: 13, color: C.inkMuted, fontWeight: 600, flexShrink: 0 }}>
          총 {filtered.length}명
        </span>
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
              <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {group.map((s, i) => (
                  <StudentRow key={s.id} student={s} currentMonth={currentMonth} onSelect={onSelectStudent} isLast={i === group.length - 1} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function StudentRow({ student, currentMonth, onSelect, isLast }) {
  const isExhausted  = student.type === "횟수제" && student.usedSessions >= student.totalSessions;
  const monthPayment = student.payments.find((p) => p.month === currentMonth);
  const isUnpaid     = !monthPayment || !monthPayment.paid;
  return (
    <div
      onClick={() => onSelect(student)}
      style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: isLast ? "none" : `1px solid ${C.border}`, cursor: "pointer", gap: 12 }}
    >
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: C.accent, flexShrink: 0 }}>
        {student.name[0]}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{student.name}</span>
          <span style={{ fontSize: 12, color: C.inkMuted }}>{student.grade}</span>
        </div>
        <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 2 }}>
          {student.days.join(", ")} · {student.type}
          {student.type === "횟수제" && ` (${student.usedSessions}/${student.totalSessions}회)`}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        {isExhausted && <Badge text="횟수 소진" color={C.accent}  bg={C.accentLight} />}
        {isUnpaid    && <Badge text="미납"      color={C.yellow} bg={C.yellowLight} />}
      </div>
      <span style={{ color: C.border, fontSize: 18 }}>›</span>
    </div>
  );
}
