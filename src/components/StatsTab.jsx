// 출석통계 탭 — 학생별 1~12월 출석 횟수 막대그래프 (보강 포함 카운트)
import { useState } from "react";
import { C, TODAY } from "../constants.js";
import { EmptyState } from "./ui.jsx";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CLASS_TYPES = ["유치부1", "유치부2", "초등부", "중고등부", "성인반"];

// 학년 문자열을 정렬 가능한 숫자로 변환 (나이순 → 초등 → 중고등 → 기타)
function gradeSortKey(grade) {
  const se = grade.match(/^(\d+)세$/);
  if (se) return Number(se[1]);
  const cho = grade.match(/^초(\d+)/);
  if (cho) return 100 + Number(cho[1]);
  const jung = grade.match(/^중(\d+)/);
  if (jung) return 200 + Number(jung[1]);
  const go = grade.match(/^고(\d+)/);
  if (go) return 300 + Number(go[1]);
  return 400;
}

// 특정 연도의 월별 출석 횟수 계산 (일반 출석 + 보강 모두 포함)
function getMonthlyCounts(student, year) {
  const counts = Array(12).fill(0);
  Object.keys(student.attendance || {}).forEach((dateStr) => {
    if (!student.attendance[dateStr]) return; // true 또는 "makeup"만 카운트
    const [y, m] = dateStr.split("-");
    if (Number(y) === year) counts[Number(m) - 1] += 1;
  });
  return counts;
}

export function StatsTab({ students }) {
  const [year, setYear] = useState(TODAY.getFullYear());
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("전체");

  const filtered = students.filter((s) => s.name.includes(search) || s.grade.includes(search));
  const visibleTypes = activeType === "전체" ? CLASS_TYPES : [activeType];
  const groups = visibleTypes
    .map((ct) => ({
      ct,
      list: filtered.filter((s) => (s.classType || "초등부") === ct).sort((a, b) => gradeSortKey(a.grade) - gradeSortKey(b.grade)),
    }))
    .filter((g) => g.list.length > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.border}` }}>
        <button onClick={() => setYear((y) => y - 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>‹</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{year}년 출석 통계</div>
        <button onClick={() => setYear((y) => y + 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>›</button>
      </div>

      <div style={{ fontSize: 12, color: C.inkMuted, margin: "8px 0", paddingLeft: 2 }}>
        💡 보강 출석도 포함해서 셉니다
      </div>

      <div style={{ position: "relative", marginBottom: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 학년 검색"
          style={{ width: "100%", padding: "12px 40px 12px 40px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, background: C.surface, outline: "none", boxSizing: "border-box" }}
        />
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.inkMuted }}>🔍</span>
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: C.border, color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginBottom: 12, minWidth: 0 }}>
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

      {groups.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <EmptyState text="검색 결과가 없습니다." />
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.ct} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{g.ct}</span>
              <span style={{ fontSize: 12, color: C.inkMuted }}>{g.list.length}명</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.list.map((s) => (
                <StudentBarChart key={s.id} student={s} year={year} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StudentBarChart({ student, year }) {
  const counts = getMonthlyCounts(student, year);
  const max = Math.max(1, ...counts);
  const BAR_MAX_HEIGHT = 60;

  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{student.name}</span>
        <span style={{ fontSize: 12, color: C.inkMuted }}>{student.grade}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 3 }}>
        {MONTHS.map((m, i) => {
          const count = counts[i];
          const barHeight = count > 0 ? Math.max(4, (count / max) * BAR_MAX_HEIGHT) : 2;
          return (
            <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: count > 0 ? "#14b8a6" : "transparent", marginBottom: 3, height: 16 }}>{count > 0 ? count : ""}</div>
              <div style={{ width: "100%", maxWidth: 18, height: BAR_MAX_HEIGHT, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: barHeight, borderRadius: "3px 3px 0 0", background: count > 0 ? "#14b8a6" : C.border }} />
              </div>
              <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 4, fontWeight: 600 }}>{m}월</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
