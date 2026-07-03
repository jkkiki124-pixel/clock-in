// 출석부 탭 — 주간 그리드 뷰 + 달력 뷰 (보강 체크 지원)
import { useState, useMemo, useEffect } from "react";
import { C, TODAY, fmtDate, fmtFullDate, getWeekDates, KR_HOLIDAYS_2026 } from "../constants.js";
import { SummaryCard, EmptyState } from "./ui.jsx";

export function AttendanceTab({ students, weekDates, weekOffset, setWeekOffset, toggleAttendance, onSelectStudent, notes, setNote }) {
  const [viewMode, setViewMode] = useState("week");
  const [calMonth, setCalMonth] = useState({ year: TODAY.getFullYear(), month: TODAY.getMonth() });

  return (
    <div>
      <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 4, marginBottom: 12, border: `1px solid ${C.border}`, gap: 4 }}>
        {[{ id: "week", label: "📋 주간 출석부" }, { id: "calendar", label: "📅 달력 보기" }].map((v) => (
          <button
            key={v.id}
            onClick={() => setViewMode(v.id)}
            style={{
              flex: 1, padding: "9px 8px", borderRadius: 7, border: "none",
              background: viewMode === v.id ? C.accent : "transparent",
              color: viewMode === v.id ? "#fff" : C.inkMuted,
              fontWeight: viewMode === v.id ? 700 : 500, fontSize: 14, transition: "all 0.15s",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {viewMode === "week"
        ? <WeekView students={students} weekDates={weekDates} weekOffset={weekOffset} setWeekOffset={setWeekOffset} toggleAttendance={toggleAttendance} onSelectStudent={onSelectStudent} />
        : <CalendarView students={students} calMonth={calMonth} setCalMonth={setCalMonth} toggleAttendance={toggleAttendance} onSelectStudent={onSelectStudent} notes={notes} setNote={setNote} />
      }
    </div>
  );
}

function WeekView({ students, weekDates, weekOffset, setWeekOffset, toggleAttendance, onSelectStudent }) {
  const todayStr = fmtFullDate(TODAY);
  const weekLabel = `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} ~ ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`;
  const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div>
      <NavBar
        label={weekLabel}
        subLabel={weekOffset === 0 ? "이번 주" : null}
        onPrev={() => setWeekOffset((w) => w - 1)}
        onNext={() => setWeekOffset((w) => w + 1)}
        onReset={weekOffset !== 0 ? () => setWeekOffset(0) : null}
        resetLabel="이번 주로"
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 12px 4px", fontSize: 13, color: C.inkMuted }}>
        <span>💡 수업 요일이 아닌 칸을 클릭하면 <b style={{ color: C.yellow }}>보강</b>으로 표시됩니다</span>
      </div>

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", borderBottom: `2px solid ${C.border}`, background: C.bg }}>
          <div style={{ padding: "10px 8px", fontSize: 13, color: C.inkMuted, fontWeight: 600 }}>학생</div>
          {weekDates.map((d, i) => {
            const isToday = fmtFullDate(d) === todayStr;
           const isSun = i === 6;
           const isSat = i === 5;
      
            return (
              <div key={i} style={{ padding: "8px 2px", textAlign: "center", background: isToday ? C.accentLight : "transparent", borderLeft: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, color: isToday ? C.accent : isSun ? "#E04040" : isSat ? C.blue : C.inkMuted, fontWeight: 700 }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 600, color: isToday ? C.accent : C.ink }}>{fmtDate(d)}</div>
              </div>
            );
          })}
        </div>

        {students.map((student, idx) => (
          <WeekRow
            key={student.id}
            student={student}
            weekDates={weekDates}
            todayStr={todayStr}
            onToggle={toggleAttendance}
            onSelect={onSelectStudent}
            isLast={idx === students.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function WeekRow({ student, weekDates, todayStr, onToggle, onSelect, isLast }) {
  const isExhausted = student.type === "횟수제" && student.usedSessions >= student.totalSessions;
  const remaining = student.type === "횟수제" ? student.totalSessions - student.usedSessions : null;
  const DAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];
  
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", borderBottom: isLast ? "none" : `1px solid ${C.border}`, background: isExhausted ? "#fff8f6" : C.surface }}>
      <div onClick={() => onSelect(student)} style={{ padding: "8px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, borderRight: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{student.name}</div>
        <div style={{ fontSize: 12, color: C.inkMuted }}>{student.grade}</div>
        {student.type === "횟수제" && (
          <div style={{ fontSize: 12, fontWeight: 700, color: isExhausted ? C.accent : C.green, background: isExhausted ? C.accentLight : C.greenLight, borderRadius: 4, padding: "1px 4px", display: "inline-block" }}>
            {isExhausted ? "❗소진" : `잔여${remaining}회`}
          </div>
        )}
        {student.type === "월정액" && (
          <div style={{ fontSize: 11, color: C.blue, background: C.blueLight, borderRadius: 4, padding: "1px 4px", display: "inline-block" }}>월정액</div>
        )}
      </div>

      {weekDates.map((d, i) => {
        const dateStr = fmtFullDate(d);
        const dayName = DAY_NAMES[i];
        const isScheduled = student.days.includes(dayName);
        const status = student.attendance[dateStr]; // true | "makeup" | undefined
        const isChecked = status === true;
        const isMakeup = status === "makeup";
        const isToday = dateStr === todayStr;
        const canCheck = !isExhausted || isChecked || isMakeup;

        return (
          <div
            key={i}
            style={{
              borderLeft: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
              background: isToday && !isChecked && !isMakeup ? "#fffaf9" : isChecked ? C.greenLight : isMakeup ? C.yellowLight : isScheduled ? "#fafafa" : "transparent",
              cursor: canCheck ? "pointer" : "default",
              minHeight: 56, transition: "background 0.1s",
            }}
            onClick={() => canCheck && onToggle(student.id, dateStr, !isScheduled)}
          >
            {isChecked ? <span style={{ fontSize: 24 }}>✅</span>
              : isMakeup ? <span style={{ fontSize: 13, fontWeight: 700, color: C.yellow }}>보강</span>
              : isScheduled ? <span style={{ fontSize: 22, color: C.border }}>○</span>
              : <span style={{ color: "#ddd", fontSize: 14 }}>—</span>}
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({ students, calMonth, setCalMonth, toggleAttendance, onSelectStudent, notes, setNote }) {
  const { year, month } = calMonth;
  const [selectedDate, setSelectedDate] = useState(null);
  const [memoDraft, setMemoDraft] = useState("");
  const todayStr = fmtFullDate(TODAY);

  useEffect(() => {
    setMemoDraft(selectedDate ? (notes[selectedDate] || "") : "");
  }, [selectedDate, notes]);

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: lastDate }, (_, i) => i + 1)];
  const isCurrentMonth = year === TODAY.getFullYear() && month === TODAY.getMonth();

  function changeMonth(delta) {
    const d = new Date(year, month + delta, 1);
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(null);
  }

  function getDateInfo(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const krDay = ["월","화","수","목","금","토","일"][(new Date(year, month, day).getDay() + 6) % 7];
    return { dateStr, krDay, scheduled: students.filter((s) => s.days.includes(krDay)), attended: students.filter((s) => s.attendance[dateStr]) };
  }

  const selectedInfo = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m2, d] = selectedDate.split("-").map(Number);
    const krDay = ["월","화","수","목","금","토","일"][(new Date(y, m2 - 1, d).getDay() + 6) % 7];
    const scheduled = students.filter((s) => s.days.includes(krDay));
    return { krDay, scheduled, attended: scheduled.filter((s) => s.attendance[selectedDate]), notAttended: scheduled.filter((s) => !s.attendance[selectedDate]) };
  }, [selectedDate, students]);

  return (
    <div>
      <NavBar
        label={`${year}년 ${month + 1}월`}
        subLabel={isCurrentMonth ? "이번 달" : null}
        onPrev={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
        onReset={!isCurrentMonth ? () => { setCalMonth({ year: TODAY.getFullYear(), month: TODAY.getMonth() }); setSelectedDate(fmtFullDate(TODAY)); } : null}
        resetLabel="오늘로"
      />

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", margin: "12px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          {["월","화","수","목","금","토","일"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", padding: "8px 2px", fontSize: 13, fontWeight: 700, color: i===6 ? "#E04040" : i===5 ? C.blue : C.inkMuted }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} style={{ minHeight: 92, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} />;
            const info = getDateInfo(day);
            const isToday = info.dateStr === todayStr;
            const isSelected = info.dateStr === selectedDate;
            const colIdx = idx % 7;
            const holiday = KR_HOLIDAYS_2026[info.dateStr];
            const note = notes[info.dateStr];

            return (
              <div key={day} onClick={() => setSelectedDate(isSelected ? null : info.dateStr)}
                style={{ minHeight: 92, padding: "6px 4px", borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: isSelected ? C.accentLight : isToday ? "#fffaf8" : C.surface, transition: "background 0.12s" }}
              >
                <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 3, color: isToday ? C.accent : holiday ? "#E04040" : colIdx===6 ? "#E04040" : colIdx===5 ? C.blue : C.ink }}>
                  {day}{isToday && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, display: "inline-block" }} />}
                </div>
                {holiday && (
                  <div style={{ fontSize: 10, color: "#E04040", fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {holiday}
                  </div>
                )}
                {note && (
                  <div style={{ fontSize: 10, color: C.blue, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    📝 {note}
                  </div>
                )}
                {info.scheduled.length > 0 && (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {info.scheduled.map((s) => <div key={s.id} style={{ width: 7, height: 7, borderRadius: "50%", background: s.attendance[info.dateStr] ? C.green : C.border }} />)}
                    </div>
                    <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 3 }}>
                      <span style={{ color: C.green, fontWeight: 700 }}>{info.attended.length}</span>/{info.scheduled.length}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, padding: "0 4px" }}>
        {[{ dot: C.green, label: "출석" }, { dot: C.border, label: "미출석" }].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.inkMuted }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot }} /> {l.label}
          </div>
        ))}
        <div style={{ fontSize: 13, color: C.inkMuted }}>날짜를 탭하면 상세 확인</div>
      </div>

      {selectedDate && selectedInfo && (
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ background: C.accent, color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedDate.replace(/-/g, ".")} ({selectedInfo.krDay})</div>
              <div style={{ fontSize: 14, opacity: 0.85, marginTop: 2 }}>출석 {selectedInfo.attended.length}명 / 예정 {selectedInfo.scheduled.length}명</div>
              {KR_HOLIDAYS_2026[selectedDate] && (
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "2px 8px", borderRadius: 6 }}>
                  🎌 {KR_HOLIDAYS_2026[selectedDate]}
                </div>
              )}
            </div>
            <button onClick={() => setSelectedDate(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", fontSize: 16 }}>✕</button>
          </div>

          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>메모 (방학, 휴원 등)</div>
            <textarea
              value={memoDraft}
              onChange={(e) => setMemoDraft(e.target.value)}
              placeholder="예: 여름방학, 임시휴원 등"
              rows={2}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
            />
            <button
              onClick={() => setNote(selectedDate, memoDraft)}
              style={{ marginTop: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 600, fontSize: 13 }}
            >
              메모 저장
            </button>
          </div>

          {selectedInfo.scheduled.length === 0
            ? <EmptyState text="이 날은 수업 예정 학생이 없습니다." />
            : (
              <>
                {selectedInfo.attended.length > 0 && (
                  <div>
                    <div style={{ padding: "10px 16px 4px", fontSize: 13, fontWeight: 700, color: C.green }}>✅ 출석 완료</div>
                    {selectedInfo.attended.map((s, i) => (
                      <DayRow key={s.id} student={s} dateStr={selectedDate} checked onToggle={toggleAttendance} onSelect={onSelectStudent} isLast={i===selectedInfo.attended.length-1 && selectedInfo.notAttended.length===0} />
                    ))}
                  </div>
                )}
                {selectedInfo.notAttended.length > 0 && (
                  <div>
                    <div style={{ padding: "10px 16px 4px", fontSize: 13, fontWeight: 700, color: C.inkMuted }}>○ 미출석</div>
                    {selectedInfo.notAttended.map((s, i) => {
                      const disabled = s.type === "횟수제" && s.usedSessions >= s.totalSessions;
                      return <DayRow key={s.id} student={s} dateStr={selectedDate} checked={false} onToggle={toggleAttendance} onSelect={onSelectStudent} isLast={i===selectedInfo.notAttended.length-1} disabled={disabled} />;
                    })}
                  </div>
                )}
              </>
            )
          }
        </div>
      )}
    </div>
  );
}

function DayRow({ student, dateStr, checked, onToggle, onSelect, isLast, disabled }) {
  const isExhausted = student.type === "횟수제" && student.usedSessions >= student.totalSessions;
  const remaining = student.type === "횟수제" ? student.totalSessions - student.usedSessions : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: isLast ? "none" : `1px solid ${C.border}`, background: checked ? "#f9fffc" : C.surface }}>
      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onSelect(student)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: checked ? C.greenLight : C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: checked ? C.green : C.accent, flexShrink: 0 }}>
            {student.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{student.name}</div>
            <div style={{ fontSize: 12, color: C.inkMuted }}>
              {student.grade}
              {student.type === "횟수제" && <span style={{ marginLeft: 6, color: isExhausted ? C.accent : C.green, fontWeight: 600 }}>{isExhausted ? "❗ 소진" : `잔여 ${remaining}회`}</span>}
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => !disabled && onToggle(student.id, dateStr)}
        style={{ width: 44, height: 44, borderRadius: 10, border: checked ? "none" : `2px solid ${disabled ? C.border : C.accent}`, background: checked ? C.greenLight : disabled ? C.bg : C.accentLight, color: checked ? C.green : disabled ? C.border : C.accent, fontSize: checked ? 20 : 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0 }}
      >
        {checked ? "✅" : "○"}
      </button>
    </div>
  );
}

function NavBar({ label, subLabel, onPrev, onNext, onReset, resetLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.border}` }}>
      <button onClick={onPrev} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>‹</button>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{label}</div>
        {subLabel && <div style={{ fontSize: 13, color: C.accent, fontWeight: 600 }}>{subLabel}</div>}
        {!subLabel && onReset && <button onClick={onReset} style={{ fontSize: 12, color: C.accent, background: "none", border: "none", textDecoration: "underline" }}>{resetLabel}</button>}
      </div>
      <button onClick={onNext} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>›</button>
    </div>
  );
}
