// 학생 상세 모달 + 학생 추가 모달 컴포넌트
import { useState } from "react";
import { C, TODAY, fmtFullDate } from "../constants.js";
import { BottomSheet, Section, InfoGrid, StudentForm } from "./ui.jsx";

const BLANK_FORM = {
  name: "", grade: "", phone: "", parentPhone: "",
  registeredAt: fmtFullDate(TODAY),
  type: "월정액", fee: 150000, totalSessions: 10, usedSessions: 0,
  days: [], memo: "",
};

// ─── 학생 상세 모달 ────────────────────────────────────────
export function StudentModal({ student, onClose, onUpdate, onDelete, togglePayment }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(student);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
  const monthPayment = student.payments.find((p) => p.month === currentMonth);
  const isPaid = monthPayment ? monthPayment.paid : false;

  const recentAttendance = Object.keys(student.attendance).sort().slice(-10).reverse();
  const isExhausted = student.type === "횟수제" && student.usedSessions >= student.totalSessions;
  const remaining = student.type === "횟수제" ? student.totalSessions - student.usedSessions : null;

  function handleSave() {
    onUpdate(form);
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
            {student.grade} · 등록일 {student.registeredAt}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setEditing(!editing);
              setForm(student);
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

      {editing ? (
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
                student.type === "횟수제"
                  ? { label: "잔여 횟수", value: `${remaining}/${student.totalSessions}회`, highlight: remaining === 0 }
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

          <Section title="최근 출석 기록">
            {recentAttendance.length === 0 ? (
              <div style={{ color: C.inkMuted, fontSize: 13 }}>출석 기록이 없습니다.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {recentAttendance.map((d) => (
                  <span
                    key={d}
                    style={{
                      background: C.greenLight,
                      color: C.green,
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    ✅ {d}
                  </span>
                ))}
              </div>
            )}
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
