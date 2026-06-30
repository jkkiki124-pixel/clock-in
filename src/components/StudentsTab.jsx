// 학생 목록 탭 — 검색 + 카드 리스트
import { useState } from "react";
import { C, TODAY } from "../constants.js";
import { Badge, EmptyState } from "./ui.jsx";

export function StudentsTab({ students, onSelectStudent }) {
  const [search, setSearch] = useState("");
  const currentMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;

  const filtered = students.filter((s) => s.name.includes(search) || s.grade.includes(search));

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

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {filtered.length === 0
          ? <EmptyState text="검색 결과가 없습니다." />
          : filtered.map((s, i) => (
            <StudentRow key={s.id} student={s} currentMonth={currentMonth} onSelect={onSelectStudent} isLast={i===filtered.length-1} />
          ))
        }
      </div>
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
