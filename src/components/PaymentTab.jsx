// 수강료 탭 — 1년 전체 보기 (학생 × 1~12월 표, 칸 안에 납부일/방법 바로 표시, 클릭 시 수정)
import { useState } from "react";
import { C, TODAY, fmtFullDate } from "../constants.js";
import { Dialog } from "./ui.jsx";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const METHODS = ["카드", "상품권", "입금", "제로페이", "기타"];

export function PaymentTab({ students, setPayment, onSelectStudent }) {
  const [year, setYear] = useState(TODAY.getFullYear());
  const [modalInfo, setModalInfo] = useState(null); // { studentId, month }

  function monthKey(m) {
    return `${year}-${String(m).padStart(2, "0")}`;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderRadius: 12, padding: "12px 16px", marginBottom: 12, border: `1px solid ${C.border}` }}>
        <button onClick={() => setYear((y) => y - 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>‹</button>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{year}년 수강료 현황</div>
        <button onClick={() => setYear((y) => y + 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>›</button>
      </div>

      <div style={{ fontSize: 12, color: C.inkMuted, marginBottom: 8, paddingLeft: 2 }}>
        💡 칸을 클릭하면 납부일과 납부 방법을 입력·수정할 수 있습니다
      </div>

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
              <th style={{ width: 60, padding: "10px 4px", fontSize: 12, color: C.inkMuted, textAlign: "left", borderRight: `1px solid ${C.border}` }}>학생</th>
              {MONTHS.map((m) => (
                <th key={m} style={{ padding: "10px 1px", fontSize: 11, color: C.inkMuted, textAlign: "center" }}>{m}월</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.id} style={{ borderBottom: idx === students.length - 1 ? "none" : `1px solid ${C.border}` }}>
                <td
                  onClick={() => onSelectStudent(student)}
                  style={{ padding: "10px 4px", cursor: "pointer", borderRight: `1px solid ${C.border}`, overflow: "hidden" }}
                >
                  <div style={{ fontWeight: 800, fontSize: 20, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.name}</div>
                  <div style={{ fontSize: 10, color: C.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.grade}</div>
                </td>
                {MONTHS.map((m) => {
                  const key = monthKey(m);
                  const payment = student.payments.find((p) => p.month === key);
                  const paid = payment && payment.paid;
                  const dateShort = paid && payment.paidAt ? payment.paidAt.slice(5).replace("-", "/") : null;

                  return (
                    <td
                      key={m}
                      onClick={() => setModalInfo({ studentId: student.id, month: key })}
                      style={{ textAlign: "center", padding: "8px 1px", cursor: "pointer", background: paid ? C.greenLight : "transparent", minHeight: 68 }}
                    >
                      {paid ? (
                        <div>
                          <div style={{ fontSize: 18 }}>✅</div>
                          <div style={{ fontSize: 12, color: C.green, fontWeight: 700, lineHeight: 1.5 }}>{dateShort}</div>
                          {payment.method && <div style={{ fontSize: 12, color: C.inkMuted, fontWeight: 600, lineHeight: 1.5 }}>{payment.method}</div>}
                          <div style={{ fontSize: 11, color: C.ink, fontWeight: 700, lineHeight: 1.5 }}>{(student.fee / 10000).toFixed(0)}만</div>
                        </div>
                      ) : (
                        <span style={{ color: C.border, fontSize: 17 }}>○</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalInfo && (
        <PaymentEditDialog
          student={students.find((s) => s.id === modalInfo.studentId)}
          month={modalInfo.month}
          onClose={() => setModalInfo(null)}
          setPayment={setPayment}
        />
      )}
    </div>
  );
}

function PaymentEditDialog({ student, month, onClose, setPayment }) {
  const existing = student.payments.find((p) => p.month === month);
  const [paidAt, setPaidAt] = useState(existing?.paidAt || fmtFullDate(TODAY));
  const [method, setMethod] = useState(existing?.method || "카드");

  const [y, m] = month.split("-");
  const monthLabel = `${y}년 ${Number(m)}월`;

  function handleSave() {
    setPayment(student.id, month, { paid: true, paidAt, method });
    onClose();
  }

  function handleUnmark() {
    setPayment(student.id, month, { paid: false });
    onClose();
  }

  return (
    <Dialog>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{student.name}</div>
      <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 20 }}>{monthLabel} 수강료 · {student.fee.toLocaleString()}원</div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>납부일</div>
        <input
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.bg }}
        />
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>납부 방법</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {METHODS.map((mth) => {
            const active = method === mth;
            return (
              <button
                key={mth}
                onClick={() => setMethod(mth)}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  border: "1px solid " + (active ? C.accent : C.border),
                  background: active ? C.accent : "transparent",
                  color: active ? "#fff" : C.inkMuted,
                  fontWeight: 600, fontSize: 13,
                }}
              >
                {mth}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {existing?.paid && (
          <button
            onClick={handleUnmark}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.accent}`, background: "none", color: C.accent, fontWeight: 600, fontSize: 14 }}
          >
            납부 취소
          </button>
        )}
        <button
          onClick={onClose}
          style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.inkMuted, fontWeight: 600, fontSize: 14 }}
        >
          닫기
        </button>
        <button
          onClick={handleSave}
          style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14 }}
        >
          저장
        </button>
      </div>
    </Dialog>
  );
}
