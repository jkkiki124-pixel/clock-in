// 보조요원 출근부 탭 컴포넌트
import { useState } from "react";
import { C, TODAY, fmtDate, fmtFullDate, getWeekDates } from "../constants.js";
import { EmptyState, BottomSheet, FormField } from "./ui.jsx";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.bg,
};

export function StaffTab({ staff, setAttendance, addStaff, updateStaff, deleteStaff }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(null);

  const baseDate = new Date(TODAY);
  baseDate.setDate(TODAY.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);
  const todayStr = fmtFullDate(TODAY);
  const weekLabel = `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} ~ ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`;
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  const totalChecks = staff.reduce((sum, s) =>
    sum + weekDates.filter((d) => s.attendance[fmtFullDate(d)]?.clockIn).length, 0
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ background: C.greenLight, borderRadius: 10, padding: "10px 16px", border: `1px solid ${C.green}22` }}>
          <div style={{ fontSize: 11, color: C.inkMuted }}>이번 주 출근</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>{totalChecks}회</div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14 }}
        >
          + 선생님 추가
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderRadius: 12, padding: "12px 16px", marginBottom: 12, border: `1px solid ${C.border}` }}>
        <button onClick={() => setWeekOffset((w) => w - 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{weekLabel}</div>
          {weekOffset === 0
            ? <div style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>이번 주</div>
            : <button onClick={() => setWeekOffset(0)} style={{ fontSize: 11, color: C.accent, background: "none", border: "none", textDecoration: "underline" }}>이번 주로</button>
          }
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>›</button>
      </div>

      {staff.length === 0 ? (
        <EmptyState text="등록된 선생님이 없습니다. 선생님을 추가해주세요." />
      ) : (
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", borderBottom: `2px solid ${C.border}`, background: C.bg }}>
            <div style={{ padding: "10px 8px", fontSize: 12, color: C.inkMuted, fontWeight: 600 }}>선생님</div>
            {weekDates.map((d, i) => {
