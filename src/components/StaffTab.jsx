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

  const baseDate = new Date(TODAY);
  baseDate.setDate(TODAY.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);
  const todayStr = fmtFullDate(TODAY);
  const weekLabel = `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} ~ ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`;
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  const totalChecks = staff.reduce((sum, s) =>
    sum + weekDates.filter((d) => s.attendance[fmtFullDate(d)]?.clockIn).length, 0
  );

  // 출근 체크 토글 — 시간 입력 없이 클릭 한 번으로 출근/취소 처리
  function toggleStaffCheck(staffId, dateStr, checked) {
    if (checked) {
      setAttendance(staffId, dateStr, null);
    } else {
      const now = new Date();
      const clockIn = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setAttendance(staffId, dateStr, { clockIn });
    }
  }

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
              const isToday = fmtFullDate(d) === todayStr;
              return (
                <div key={i} style={{ padding: "8px 2px", textAlign: "center", background: isToday ? C.accentLight : "transparent", borderLeft: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: isToday ? C.accent : i === 0 ? "#E04040" : C.inkMuted, fontWeight: 700 }}>{DAY_NAMES[i]}</div>
                  <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? C.accent : C.ink }}>{fmtDate(d)}</div>
                </div>
              );
            })}
          </div>

          {staff.map((s, idx) => (
            <StaffRow
              key={s.id}
              staff={s}
              weekDates={weekDates}
              todayStr={todayStr}
              isLast={idx === staff.length - 1}
              onSelect={() => setSelectedStaff(s)}
              onCellClick={(dateStr) => toggleStaffCheck(s.id, dateStr, !!s.attendance[dateStr]?.clockIn)}
            />
          ))}
        </div>
      )}

      {selectedStaff && (
        <StaffModal
          staff={staff.find((s) => s.id === selectedStaff.id) || selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onUpdate={(updated) => { updateStaff(updated); setSelectedStaff(updated); }}
          onDelete={(id) => { deleteStaff(id); setSelectedStaff(null); }}
        />
      )}

      {addOpen && (
        <AddStaffModal
          onClose={() => setAddOpen(false)}
          onAdd={(data) => { addStaff(data); setAddOpen(false); }}
        />
      )}
    </div>
  );
}

function StaffRow({ staff, weekDates, todayStr, isLast, onSelect, onCellClick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", borderBottom: isLast ? "none" : `1px solid ${C.border}`, background: C.surface }}>
      <div onClick={onSelect} style={{ padding: "10px 8px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, borderRight: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{staff.name}</div>
        <div style={{ fontSize: 11, color: C.inkMuted }}>{staff.role}</div>
      </div>
      {weekDates.map((d, i) => {
        const dateStr = fmtFullDate(d);
        const rec = staff.attendance[dateStr];
        const isToday = dateStr === todayStr;
        return (
          <div key={i} onClick={() => onCellClick(dateStr)}
            style={{ borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: isToday ? "#fffaf9" : rec?.clockIn ? C.greenLight : C.surface, cursor: "pointer", minHeight: 60, padding: "4px 2px", transition: "background 0.1s" }}
          >
            {rec?.clockIn ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{rec.clockIn}</div>
                {rec.clockOut && <div style={{ fontSize: 10, color: C.inkMuted }}>{rec.clockOut}</div>}
                {rec.memo && <div style={{ fontSize: 9, color: C.accent, marginTop: 1 }}>📝</div>}
              </div>
            ) : (
              <span style={{ fontSize: 16, color: C.border }}>○</span>
            )}
          </div>
        );
      })}
    </div>
  );
}


function StaffModal({ staff, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(staff);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const recentDates = Object.keys(staff.attendance).sort().slice(-7).reverse();

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, color: C.blue }}>
          {staff.name[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{staff.name}</div>
          <div style={{ fontSize: 13, color: C.inkMuted }}>{staff.role}</div>
        </div>
        <button onClick={() => { setEditing(!editing); setForm(staff); }} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 13, color: C.inkMuted }}>
          {editing ? "취소" : "✏️ 수정"}
        </button>
      </div>

      {editing ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField label="이름"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="역할"><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="보조강사, 행정 등" style={inputStyle} /></FormField>
            <FormField label="연락처"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" style={inputStyle} /></FormField>
            <FormField label="메모"><textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></FormField>
            <button onClick={() => { onUpdate(form); setEditing(false); }} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15 }}>저장</button>
          </div>
          <div style={{ marginTop: 12 }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: `1px solid ${C.accent}`, background: "none", color: C.accent, fontWeight: 600, fontSize: 14 }}>🗑️ 선생님 삭제</button>
            ) : (
              <div style={{ background: C.accentLight, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, color: C.accent }}>정말 삭제하시겠어요?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 600 }}>취소</button>
                  <button onClick={() => onDelete(staff.id)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700 }}>삭제</button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              <div><div style={{ fontSize: 11, color: C.inkMuted }}>역할</div><div style={{ fontSize: 14, fontWeight: 600 }}>{staff.role || "-"}</div></div>
              <div><div style={{ fontSize: 11, color: C.inkMuted }}>연락처</div><div style={{ fontSize: 14, fontWeight: 600 }}>{staff.phone || "-"}</div></div>
              {staff.memo && <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 11, color: C.inkMuted }}>메모</div><div style={{ fontSize: 14, fontWeight: 600 }}>{staff.memo}</div></div>}
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, marginBottom: 10 }}>최근 출퇴근 기록</div>
          {recentDates.length === 0
            ? <div style={{ color: C.inkMuted, fontSize: 13 }}>출근 기록이 없습니다.</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {recentDates.map((dateStr) => {
                  const rec = staff.attendance[dateStr];
                  return (
                    <div key={dateStr} style={{ background: C.bg, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, minWidth: 80 }}>{dateStr}</div>
                      <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>출근 {rec.clockIn}</div>
                      {rec.clockOut && <div style={{ fontSize: 13, color: C.inkMuted }}>퇴근 {rec.clockOut}</div>}
                      {rec.memo && <div style={{ fontSize: 12, color: C.accent, marginLeft: "auto" }}>📝 {rec.memo}</div>}
                    </div>
                  );
                })}
              </div>
            )
          }
        </>
      )}
    </BottomSheet>
  );
}

function AddStaffModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", role: "보조강사", phone: "", memo: "" });

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>선생님 추가</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="이름 *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" style={inputStyle} /></FormField>
        <FormField label="역할"><input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="보조강사, 행정 등" style={inputStyle} /></FormField>
        <FormField label="연락처"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" style={inputStyle} /></FormField>
        <FormField label="메모"><textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} rows={2} placeholder="특이사항 등" style={{ ...inputStyle, resize: "vertical" }} /></FormField>
        <button
          onClick={() => { if (!form.name.trim()) { alert("이름을 입력해주세요."); return; } onAdd(form); }}
          style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15 }}
        >
          등록 완료
        </button>
      </div>
    </BottomSheet>
  );
}
