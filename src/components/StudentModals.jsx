// 학생 상세 모달 + 학생 추가 모달 컴포넌트
import { useState } from "react";
import { C, TODAY, fmtFullDate } from "../constants.js";
import { BottomSheet, Section, InfoGrid, StudentForm } from "./ui.jsx";

const BLANK_FORM = {
  name: "", grade: "", phone: "", parentPhone: "",
  registeredAt: fmtFullDate(TODAY),
  type: "월정액", fee: 150000, totalSessions: 10, usedSessions: 0,
  days: [], memo: "", classType: "초등부", status: "active",
};

// ─── 학생 상세 모달 ────────────────────────────────────────
export function StudentModal({ student, onClose, onUpdate, onDelete, togglePayment, setStudentStatus, onSessionChange }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(student);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sessionChangeStep, setSessionChangeStep] = useState(null); // { newTotalSessions, effectiveFrom }

  const currentMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
  const monthPayment = student.payments.find((p) => p.month === currentMonth);
  const isPaid = monthPayment ? monthPayment.paid : false;

  const isExhausted = student.type === "횟수제" && student.usedSessions >= student.totalSessions;
  const remaining = student.type === "횟수제" ? student.totalSessions - student.usedSessions : null;

  function handleSave() {
    const sessionsChanged = form.type === "횟수제" && Number(form.totalSessions) !== Number(student.totalSessions);

    if (sessionsChanged) {
      // 바로 저장하지 않고, 적용 시작일을 먼저 확인
      setSessionChangeStep({ newTotalSessions: Number(form.totalSessions), effectiveFrom: fmtFullDate(TODAY) });
      return;
    }

    onUpdate(form);
    setEditing(false);
  }

  function confirmSessionChange() {
    onUpdate(form);
    onSessionChange(student.id, sessionChangeStep.newTotalSessions, sessionChangeStep.effectiveFrom);
    setSessionChangeStep(null);
    setEditing(false);
  }

  function handleDelete() {
    onDelete(student.id);
    onClose();
  }

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
            onClick={() => setStudentStatus(student.id, student.status === "withdrawn" ? "active" : "withdrawn")}
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

      {sessionChangeStep ? (
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
      ) : editing ? (
        <>
          <StudentForm form={form} setForm={setForm} onSubmit={handleSave} submitLabel="저장" />
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
              ]}
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
