// 출석부 탭 — 주간 그리드 뷰 + 달력 뷰
import { useState, useMemo } from "react";
import { C, TODAY, fmtDate, fmtFullDate, getWeekDates, KR_DAYS } from "../constants.js";
import { SummaryCard, EmptyState } from "./ui.jsx";

export function AttendanceTab({ students, weekDates, weekOffset, setWeekOffset, toggleAttendance, onSelectStudent }) {
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
        : <CalendarView students={students} calMonth={calMonth} setCalMonth={setCalMonth} toggleAttendance={toggleAttendance} onSelectStudent={onSelectStudent} />
      }
    </div>
  );
}

function WeekView({ students, weekDates, weekOffset, setWeekOffset, toggleAttendance, onSelectStudent }) {
  const todayStr = fmtFullDate(TODAY);
  const weekLabel = `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} ~ ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`;
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  const totalChecks = students.reduce((sum, s) => sum + weekDates.filter((d) => s.attendance[fmtFullDate(d)]).length, 0);
  const sessionStudents = students.filter((s) => s.type === "횟수제");
  const exhausted = sessionStudents.filter((s) => s.usedSessions >= s.totalSessions);

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "12px 0" }}>
        <SummaryCard label="이번 주 출석" value={totalChecks} color={C.green} bg={C.greenLight} icon="✅" />
        <SummaryCard label="횟수제 학생" value={`${sessionStudents.length}명`} color={C.blue} bg={C.blueLight} icon="🔢" />
        <SummaryCard label="잔여 0 학생" value={`${exhausted.length}명`}
          color={exhausted.length > 0 ? C.accent : C.inkMuted}
          bg={exhausted.length > 0 ? C.accentLight : C.bg} icon="⚠️" />
      </div>

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", borderBottom: `2px solid ${C.border}`, background: C.bg }}>
          <div style={{ padding: "10px 8px", fontSize: 12, color: C.inkMuted, fontWeight: 600 }}>학생</div>
          {weekDates.map((d, i) => {
            const isToday = fmtFullDate(d) === todayStr;
            const isSun = i === 0;
            const isSat = i === 6;
            return (
              <div key={i} style={{ padding: "8px 2px", textAlign: "center", background: isToday ? C.accentLight : "transparent", borderLeft: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: isToday ? C.accent : isSun ? "#E04040" : isSat ? C.blue : C.inkMuted, fontWeight: 700 }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? C.accent : C.ink }}>{fmtDate(d)}</div>
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
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", borderBottom: isLast ? "none" : `1px solid ${C.border}`, background: isExhausted ? "#fff8f6" : C.surface }}>
      <div onClick={() => onSelect(student)} style={{ padding: "8px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, borderRight: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{student.name}</div>
        <div style={{ fontSize: 10, color: C.inkMuted }}>{student.grade}</div>
        {student.type === "횟수제" && (
          <div style={{ fontSize: 10, fontWeight: 700, color: isExhausted ? C.accent : C.green, background: isExhausted ? C.accentLight : C.greenLight, borderRadius: 4, padding: "1px 4px", display: "inline-block" }}>
            {isExhausted ? "❗소진" : `잔여${remaining}회`}
          </div>
        )}
        {student.type === "월정액" && (
          <div style={{ fontSize: 9, color: C.blue, background: C.blueLight, borderRadius: 4, padding: "1px 4px", display: "inline-block" }}>월정액</div>
        )}
      </div>

      {weekDates.map((d, i) => {
        const dateStr = fmtFullDate(d);
        const dayName = DAY_NAMES[i];
        const isScheduled = student.days.includes(dayName);
        const isChecked = !!student.attendance[dateStr];
        const isToday = dateStr === todayStr;
        const canCheck = !isExhausted || isChecked;

        return (
          <div
            key={i}
            style={{
              borderLeft: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
              background: isToday ? "#fffaf9" : isChecked ? C.greenLight : isScheduled ? "#fafafa" : "transparent",
              cursor: isScheduled && canCheck ? "pointer" : "default",
              minHeight: 52, transition: "background 0.1s",
            }}
            onClick={() => isScheduled && canCheck && onToggle(student.id, dateStr)}
          >
            {isChecked ? <span style={{ fontSize: 20 }}>✅</span>
              : isScheduled ? <span style={{ fontSize: 18, color: C.border }}>○</span>
              : <span style={{ color: "#eee", fontSize: 12 }}>—</span>}
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({ students, calMonth, setCalMonth, toggleAttendance, onSelectStudent }) {
  const { year, month } = calMonth;
  const [selectedDate, setSelectedDate] = useState(null);
  const todayStr = fmtFullDate(TODAY);

  const firstDay = new Date(year, month, 1).getDay();
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
    const krDay = KR_DAYS[new Date(year, month, day).getDay()];
    return { dateStr, krDay, scheduled: students.filter((s) => s.days.includes(krDay)), attended: students.filter((s) => s.attendance[dateStr]) };
  }

  const selectedInfo = useMemo(() => {
    if (!selectedDate) return null;
    const [y, m2, d] = selectedDate.split("-").map(Number);
    const krDay = KR_DAYS[new Date(y, m2 - 1, d).getDay()];
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
          {["일","월","화","수","목","금","토"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", padding: "8px 2px", fontSize: 12, fontWeight: 700, color: i===0 ? "#E04040" : i===6 ? C.blue : C.inkMuted }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} style={{ minHeight: 64, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} />;
            const info = getDateInfo(day);
            const isToday = info.dateStr === todayStr;
            const isSelected = info.dateStr === selectedDate;
            const colIdx = idx % 7;

            return (
              <div key={day} onClick={() => setSelectedDate(isSelected ? null : info.dateStr)}
                style={{ minHeight: 64, padding: "6px 4px", borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, cursor: info.scheduled.length > 0 ? "pointer" : "default", background: isSelected ? C.accentLight : isToday ? "#fffaf8" : C.surface, transition: "background 0.12s" }}
              >
                <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 3, color: isToday ? C.accent : colIdx===0 ? "#E04040" : colIdx===6 ? C.blue : C.ink }}>
                  {day}{isToday && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, display: "inline-block" }} />}
                </div>
                {info.scheduled.length > 0 && (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {info.scheduled.map((s) => <div key={s.id} style={{ width: 7, height: 7, borderRadius: "50%", background: s.attendance[info.dateStr] ? C.green : C.border }} />)}
                    </div>
                    <div style={{ fontSize: 10, color: C.inkMuted, marginTop: 3 }}>
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
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.inkMuted }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot }} /> {l.label}
          </div>
        ))}
        <div style={{ fontSize: 12, color: C.inkMuted }}>날짜를 탭하면 상세 확인</div>
      </div>

      {selectedDate && selectedInfo && (
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ background: C.accent, color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedDate.replace(/-/g, ".")} ({selectedInfo.krDay})</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>출석 {selectedInfo.attended.length}명 / 예정 {selectedInfo.scheduled.length}명</div>
            </div>
            <button onClick={() => setSelectedDate(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", fontSize: 16 }}>✕</button>
          </div>

          {selectedInfo.scheduled.length === 0
            ? <EmptyState text="이 날은 수업 예정 학생이 없습니다." />
            : (
              <>
                {selectedInfo.attended.length > 0 && (
                  <div>
                    <div style={{ padding: "10px 16px 4px", fontSize: 12, fontWeight: 700, color: C.green }}>✅ 출석 완료</div>
                    {selectedInfo.attended.map((s, i) => (
                      <DayRow key={s.id} student={s} dateStr={selectedDate} checked onToggle={toggleAttendance} onSelect={onSelectStudent} isLast={i===selectedInfo.attended.length-1 && selectedInfo.notAttended.length===0} />
                    ))}
                  </div>
                )}
                {selectedInfo.notAttended.length > 0 && (
                  <div>
                    <div style={{ padding: "10px 16px 4px", fontSize: 12, fontWeight: 700, color: C.inkMuted }}>○ 미출석</div>
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
            <div style={{ fontWeight: 600, fontSize: 14 }}>{student.name}</div>
            <div style={{ fontSize: 11, color: C.inkMuted }}>
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
        {subLabel && <div style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{subLabel}</div>}
        {!subLabel && onReset && <button onClick={onReset} style={{ fontSize: 11, color: C.accent, background: "none", border: "none", textDecoration: "underline" }}>{resetLabel}</button>}
      </div>
      <button onClick={onNext} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>›</button>
    </div>
  );
}
