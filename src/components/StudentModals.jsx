// 학생 상세 모달 + 학생 추가 모달 컴포넌트
import { useState } from "react";
import { C, TODAY, fmtFullDate } from "../constants.js";
import { BottomSheet, Section, InfoGrid, StudentForm } from "./ui.jsx";

const BLANK_FORM = {
  name: "", grade: "", phone: "", parentPhone: "",
  registeredAt: fmtFullDate(TODAY),
  type: "월정액", fee: 150000, totalSessions: 10,
  days: [], memo: "", classType: "초등부", status: "active",
};

function sameDays(a, b) {
  const sa = [...(a || [])].sort().join(",");
  const sb = [...(b || [])].sort().join(",");
  return sa === sb;
}

// "2026-09-11" → "9/11" (이력 목록 표시용)
function shortDate(dateStr) {
  if (!dateStr) return "-";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// ─── 학생 상세 모달 ────────────────────────────────────────
// onSessionDelete / onSessionDateChange 는 선택 props — 넘기지 않으면 "횟수 변경 이력" 영역이 표시되지 않는다.
export function StudentModal({
  student, onClose, onUpdate, onDelete, togglePayment, setStudentStatus,
  onSessionChange, onDayChange, onSessionDelete, onSessionDateChange,
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(student);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sessionChangeStep, setSessionChangeStep] = useState(null); // { newTotalSessions, effectiveFrom }
  const [dayChangeStep, setDayChangeStep] = useState(null); // { newDays, newClassType, effectiveFrom }
  const [rejoinStep, setRejoinStep] = useState(null); // { activeFrom }
  const [withdrawStep, setWithdrawStep] = useState(null); // { withdrawnAt }
  const [historyEdit, setHistoryEdit] = useState(null); // { id, effectiveFrom } — 횟수 이력 적용일 수정 중인 항목

  const currentMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
  const monthPayment = student.payments.find((p) => p.month === currentMonth);
  const isPaid = monthPayment ? monthPayment.paid : false;

  // 진행회차/잔여/마감여부는 useStudents.js의 loadStudents()에서
  // sessionNumbers(이력 기반 계산) 하나만을 근거로 이미 계산되어 내려온다.
  // (예전에는 여기서 별도의 usedSessions 카운터로 다시 계산했는데,
  //  결제 리셋 시점과 회차 이력 구간이 어긋나면 두 값이 서로 달라지는 문제가 있었음)
  const isExhausted = student.isExhausted;
  const remaining = student.remainingSessions;
  const currentSessionNumber = student.currentSessionNumber;

  function handleSave() {
    // 횟수 숫자가 바뀌었거나, 월정액→횟수제로 유형이 바뀌었거나, 횟수제인데 회차 이력이 아직 없으면
    // 적용 시작일을 확인하고 회차 이력을 새로 만든다. (이력이 없으면 회차 계산이 전혀 안 됨)
    const sessionsChanged =
      form.type === "횟수제" &&
      (Number(form.totalSessions) !== Number(student.totalSessions) ||
        student.type !== "횟수제" ||
        !(student.sessionHistory && student.sessionHistory.length > 0));
    const daysChanged = !sameDays(form.days, student.days) || form.classType !== student.classType;

    if (sessionsChanged) {
      // 바로 저장하지 않고, 적용 시작일을 먼저 확인 (요일도 바뀌었으면 이어서 확인)
      setSessionChangeStep({ newTotalSessions: Number(form.totalSessions), effectiveFrom: fmtFullDate(TODAY), thenDaysChanged: daysChanged });
      return;
    }

    if (daysChanged) {
      setDayChangeStep({ newDays: form.days, newClassType: form.classType, effectiveFrom: fmtFullDate(TODAY) });
      return;
    }

    onUpdate(form);
    setEditing(false);
  }

  function confirmSessionChange() {
    if (!sessionChangeStep.effectiveFrom) {
      alert("적용 시작일을 선택해주세요.");
      return;
    }
    onUpdate(form);
    onSessionChange(student.id, sessionChangeStep.newTotalSessions, sessionChangeStep.effectiveFrom);
    const needsDayStep = sessionChangeStep.thenDaysChanged;
    setSessionChangeStep(null);
    if (needsDayStep) {
      setDayChangeStep({ newDays: form.days, newClassType: form.classType, effectiveFrom: fmtFullDate(TODAY) });
    } else {
      setEditing(false);
    }
  }

  function confirmDayChange() {
    if (!dayChangeStep.effectiveFrom) {
      alert("적용 시작일을 선택해주세요.");
      return;
    }
    // 이력(day_config_history)만 쌓고 학생 레코드 자체(days/class_type)는 갱신하지 않던 버그 수정.
    // 요일만 단독으로 바꿀 때는 onUpdate가 호출될 경로가 없어서, 상세화면에 보이는 "수업 요일"이
    // 이력에는 새 값이 쌓였음에도 계속 예전 값으로 남아있었음.
    onUpdate(form);
    onDayChange(student.id, dayChangeStep.newDays, dayChangeStep.effectiveFrom, dayChangeStep.newClassType);
    setDayChangeStep(null);
    setEditing(false);
  }

  function handleDelete() {
    onDelete(student.id);
    onClose();
  }

  // 횟수 변경 이력 1건 삭제 (마지막 남은 1건은 삭제 불가 — useStudents.js에서 막음)
  async function handleHistoryDelete(h) {
    const ok = window.confirm(
      `${h.effectiveFrom}부터 ${h.totalSessions}회 이력을 삭제할까요?\n출석 기록은 그대로 유지되고, 회차 계산만 달라집니다.`
    );
    if (!ok) return;
    const res = await onSessionDelete(student.id, h.id);
    if (res && !res.ok) {
      alert(res.reason === "last" ? "마지막 남은 이력은 삭제할 수 없어요." : "삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  // 횟수 변경 이력의 적용 시작일만 수정 (총 횟수는 그대로)
  async function handleHistoryDateSave() {
    if (!historyEdit.effectiveFrom) {
      alert("적용 시작일을 선택해주세요.");
      return;
    }
    const res = await onSessionDateChange(student.id, historyEdit.id, historyEdit.effectiveFrom);
    if (res && !res.ok) {
      alert(res.reason === "duplicate" ? "그 날짜에 이미 다른 횟수 이력이 있어요. 먼저 그 이력을 삭제하거나 다른 날짜를 선택해주세요." : "수정에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setHistoryEdit(null);
  }

  // 자동으로 만들어진 "앞 구간" 이력(isBaseline)은 계산용이라 화면에서 숨긴다
  const sessionHistory = (student.sessionHistory || []).filter((h) => !h.isBaseline);
  const showSessionHistory =
    student.type === "횟수제" && sessionHistory.length > 0 && onSessionDelete && onSessionDateChange;

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: C.accentLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 22,
            color: C.accent,
            flexShrink: 0,
          }}
        >
          {student.name[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{student.name}</div>
          <div style={{ fontSize: 13, color: C.inkMuted }}>
            {student.classType} · {student.grade} · 등록일 {student.registeredAt}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              if (student.status === "withdrawn") {
                setRejoinStep({ activeFrom: fmtFullDate(TODAY) });
              } else {
                setWithdrawStep({ withdrawnAt: fmtFullDate(TODAY) });
              }
            }}
            style={{
              background: "none",
              border: `1px solid ${student.status === "withdrawn" ? C.green : C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              color: student.status === "withdrawn" ? C.green : C.inkMuted,
            }}
          >
            {student.status === "withdrawn" ? "🔄 재원처리" : "🚪 퇴원처리"}
          </button>
          <button
            onClick={() => {
              setEditing(!editing);
              setForm(student);
              setSessionChangeStep(null);
              setDayChangeStep(null);
              setRejoinStep(null);
              setWithdrawStep(null);
              setHistoryEdit(null);
            }}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              color: C.inkMuted,
            }}
          >
            {editing ? "취소" : "✏️ 수정"}
          </button>
        </div>
      </div>

      {withdrawStep ? (
        <div style={{ background: C.accentLight, borderRadius: 10, padding: "16px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.accent }}>
            퇴원 처리
          </div>
          <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
            아래 날짜까지의 출석 기록은 달력에 그대로 남고,<br />
            그 다음 날부터는 출석부에 표시되지 않습니다.
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>퇴원일</div>
            <input
              type="date"
              value={withdrawStep.withdrawnAt}
              onChange={(e) => setWithdrawStep((s) => ({ ...s, withdrawnAt: e.target.value }))}
              onClick={(ev) => ev.target.showPicker?.()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.surface, cursor: "pointer", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setWithdrawStep(null)}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 600, fontSize: 14 }}
            >
              취소
            </button>
            <button
              onClick={() => { setStudentStatus(student.id, "withdrawn", withdrawStep.withdrawnAt); setWithdrawStep(null); }}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14 }}
            >
              퇴원 처리
            </button>
          </div>
        </div>
      ) : rejoinStep ? (
        <div style={{ background: C.greenLight, borderRadius: 10, padding: "16px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.green }}>
            재원 처리
          </div>
          <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
            아래 날짜부터 출석부에 다시 표시됩니다.<br />
            그 이전 기간은 결석으로 표시되지 않습니다.
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>재원 시작일</div>
            <input
              type="date"
              value={rejoinStep.activeFrom}
              onChange={(e) => setRejoinStep((s) => ({ ...s, activeFrom: e.target.value }))}
              onClick={(ev) => ev.target.showPicker?.()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.surface, cursor: "pointer", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setRejoinStep(null)}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 600, fontSize: 14 }}
            >
              취소
            </button>
            <button
              onClick={() => { setStudentStatus(student.id, "active", rejoinStep.activeFrom); setRejoinStep(null); }}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: C.green, color: "#fff", fontWeight: 700, fontSize: 14 }}
            >
              재원 처리
            </button>
          </div>
        </div>
      ) : sessionChangeStep ? (
        <div style={{ background: C.accentLight, borderRadius: 10, padding: "16px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.accent }}>
            횟수 변경 확인
          </div>
          <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
            <b>{student.totalSessions}회</b> → <b>{sessionChangeStep.newTotalSessions}회</b>로 변경합니다.<br />
            아래 날짜부터 새 횟수가 적용되며, 그 이전 출석 기록의 회차는 그대로 유지됩니다.
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>적용 시작일</div>
            <input
              type="date"
              value={sessionChangeStep.effectiveFrom}
              onChange={(e) => setSessionChangeStep((s) => ({ ...s, effectiveFrom: e.target.value }))}
              onClick={(ev) => ev.target.showPicker?.()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.surface, cursor: "pointer", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 6 }}>
              기본값은 오늘이에요. 실제로 바뀐 날짜가 다르면 꼭 수정해주세요.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSessionChangeStep(null)}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 600, fontSize: 14 }}
            >
              취소
            </button>
            <button
              onClick={confirmSessionChange}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14 }}
            >
              이 날짜부터 적용
            </button>
          </div>
        </div>
      ) : dayChangeStep ? (
        <div style={{ background: C.blueLight, borderRadius: 10, padding: "16px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.blue }}>
            수업 요일 변경 확인
          </div>
          <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
            <b>{student.days.join(", ") || "-"}</b> → <b>{dayChangeStep.newDays.join(", ") || "-"}</b>로 변경합니다.<br />
            아래 날짜부터 새 요일이 적용되며, 그 이전 출석부 기록은 그대로 유지됩니다.
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>적용 시작일</div>
            <input
              type="date"
              value={dayChangeStep.effectiveFrom}
              onChange={(e) => setDayChangeStep((s) => ({ ...s, effectiveFrom: e.target.value }))}
              onClick={(ev) => ev.target.showPicker?.()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.surface, cursor: "pointer", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setDayChangeStep(null); setEditing(false); }}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 600, fontSize: 14 }}
            >
              취소
            </button>
            <button
              onClick={confirmDayChange}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: C.blue, color: "#fff", fontWeight: 700, fontSize: 14 }}
            >
              이 날짜부터 적용
            </button>
          </div>
        </div>
      ) : editing ? (
        <>
          <StudentForm form={form} setForm={setForm} onSubmit={handleSave} submitLabel="저장" />

          {/* 횟수 변경 이력은 수정 모드에서만 표시 (실수로 누르는 것 방지) */}
          {showSessionHistory && (
            <Section title="횟수 변경 이력">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sessionHistory.map((h, i) => {
                  const isCurrent = i === sessionHistory.length - 1;
                  const isEditingThis = historyEdit && historyEdit.id === h.id;
                  return (
                    <div
                      key={h.id}
                      style={{
                        border: `1px solid ${isCurrent ? C.accent : C.border}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        background: C.surface,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
                          {shortDate(h.effectiveFrom)}부터 {h.totalSessions}회
                          {isCurrent && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: C.accent, fontWeight: 700 }}>현재 적용</span>
                          )}
                        </div>
                        {!isEditingThis && (
                          <>
                            <button
                              onClick={() => setHistoryEdit({ id: h.id, effectiveFrom: h.effectiveFrom })}
                              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, color: C.inkMuted }}
                            >
                              날짜 수정
                            </button>
                            <button
                              onClick={() => handleHistoryDelete(h)}
                              disabled={sessionHistory.length <= 1}
                              style={{
                                background: "none",
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                padding: "4px 10px",
                                fontSize: 12,
                                color: sessionHistory.length <= 1 ? C.border : C.accent,
                              }}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                      {isEditingThis && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>적용 시작일</div>
                          <input
                            type="date"
                            value={historyEdit.effectiveFrom}
                            onChange={(e) => setHistoryEdit((s) => ({ ...s, effectiveFrom: e.target.value }))}
                            onClick={(ev) => ev.target.showPicker?.()}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.surface, cursor: "pointer", boxSizing: "border-box" }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button
                              onClick={() => setHistoryEdit(null)}
                              style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontWeight: 600, fontSize: 13 }}
                            >
                              취소
                            </button>
                            <button
                              onClick={handleHistoryDateSave}
                              style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 13 }}
                            >
                              날짜 저장
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 8, lineHeight: 1.5 }}>
                가장 늦은 날짜의 이력이 "현재 적용"이 됩니다. 출석 기록은 지워지지 않고, 회차 계산만 달라집니다.
              </div>
            </Section>
          )}
          <div style={{ marginTop: 12 }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 10,
                  border: `1px solid ${C.accent}`,
                  background: "none",
                  color: C.accent,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                🗑️ 학생 삭제
              </button>
            ) : (
              <div style={{ background: C.accentLight, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, color: C.accent }}>정말 삭제하시겠어요?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: 8,
                      border: "none",
                      background: C.accent,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <Section title="수강 정보">
            <InfoGrid
              items={[
                { label: "수강 유형", value: student.type },
                { label: "수강료", value: `${student.fee.toLocaleString()}원` },
                { label: "수업 요일", value: student.days.join(", ") },
                student.type === "횟수제"
                  ? { label: "진행회차", value: `${currentSessionNumber ?? 0}회 / ${student.totalSessions}회` }
                  : null,
              ].filter(Boolean)}
            />
          </Section>

          <Section title="연락처">
            <InfoGrid
              items={[
                { label: "연락처", value: student.phone || "-" },
                { label: "학부모 연락처", value: student.parentPhone || "-" },
                { label: "메모", value: student.memo || "-" },
              ]}
            />
          </Section>

          <Section title="이번달 수강료">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{student.fee.toLocaleString()}원</div>
                {isPaid && <div style={{ fontSize: 12, color: C.green }}>납부일: {monthPayment.paidAt}</div>}
              </div>
              <button
                onClick={() => togglePayment(student.id, currentMonth)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: isPaid ? C.greenLight : C.accent,
                  color: isPaid ? C.green : "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {isPaid ? "✅ 납부 완료" : "납부 처리"}
              </button>
            </div>
          </Section>
        </>
      )}
    </BottomSheet>
  );
}

// ─── 학생 추가 모달 ────────────────────────────────────────
export function AddStudentModal({ onClose, onAdd }) {
  const [form, setForm] = useState(BLANK_FORM);

  function handleAdd() {
    if (!form.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    onAdd(form);
    onClose();
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>새 학생 등록</div>
      <StudentForm form={form} setForm={setForm} onSubmit={handleAdd} submitLabel="등록 완료" />
    </BottomSheet>
  );
}
