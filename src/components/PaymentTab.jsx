// 수강료 탭 — 월별 납부 현황 + 토글
import { useState } from "react";
import { C, TODAY } from "../constants.js";
import { SummaryCard, SectionTitle, EmptyState } from "./ui.jsx";

export function PaymentTab({ students, togglePayment, onSelectStudent }) {
  const currentMonth = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
  const [viewMonth, setViewMonth] = useState(currentMonth);

  function changeMonth(delta) {
    const [y, m] = viewMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const paid   = students.filter((s) => s.payments.some((p) => p.month === viewMonth && p.paid));
  const unpaid = students.filter((s) => { const p = s.payments.find((pp) => pp.month === viewMonth); return !p || !p.paid; });
  const totalRevenue = paid.reduce((sum, s) => sum + s.fee, 0);

  return (
    <div>
      {/* 월 네비 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderRadius: 12, padding: "12px 16px", marginBottom: 12, border: `1px solid ${C.border}` }}>
        <button onClick={() => changeMonth(-1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{viewMonth.replace("-", "년 ")}월</div>
          {viewMonth === currentMonth
            ? <div style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>이번 달</div>
            : <button onClick={() => setViewMonth(currentMonth)} style={{ fontSize: 11, color: C.accent, background: "none", border: "none", textDecoration: "underline" }}>이번 달로</button>
          }
        </div>
        <button onClick={() => changeMonth(1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>›</button>
      </div>

      {/* 요약 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        <SummaryCard label="수납 완료" value={`${paid.length}명`}   color={C.green}  bg={C.greenLight}  icon="✅" />
        <SummaryCard label="미납"      value={`${unpaid.length}명`} color={unpaid.length > 0 ? C.accent : C.inkMuted} bg={unpaid.length > 0 ? C.accentLight : C.bg} icon="❗" />
        <SummaryCard label="수납액"    value={`${(totalRevenue/10000).toFixed(0)}만원`} color={C.blue} bg={C.blueLight} icon="💰" />
      </div>

      {/* 미납 목록 */}
      {unpaid.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionTitle color={C.accent}>❗ 미납 학생</SectionTitle>
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {unpaid.map((s, i) => (
              <PaymentRow key={s.id} student={s} month={viewMonth} onToggle={togglePayment} onSelect={onSelectStudent} isLast={i===unpaid.length-1} isPaid={false} />
            ))}
          </div>
        </div>
      )}

      {/* 납부 완료 목록 */}
      <div>
        <SectionTitle color={C.green}>✅ 납부 완료</SectionTitle>
        {paid.length === 0
          ? <EmptyState text="납부 완료된 학생이 없습니다." />
          : (
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {paid.map((s, i) => (
                <PaymentRow key={s.id} student={s} month={viewMonth} onToggle={togglePayment} onSelect={onSelectStudent} isLast={i===paid.length-1} isPaid={true} />
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

function PaymentRow({ student, month, onToggle, onSelect, isLast, isPaid }) {
  const payment = student.payments.find((p) =>
