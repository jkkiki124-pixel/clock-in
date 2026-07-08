// 수강료 탭 — 1년 전체 보기 (검색·반별 분류·퇴원생 필터 포함, 학생 × 1~12월 표)
import { useState, useRef, useLayoutEffect, Fragment } from "react";
import { C, TODAY } from "../constants.js";
import { Dialog, EmptyState } from "./ui.jsx";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const METHODS = ["카드", "상품권", "입금", "제로페이", "기타"];
const CLASS_TYPES = ["유치부", "초등부", "중고등부", "성인반"];

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

export function PaymentTab({ students, setPayment, onSelectStudent }) {
  const [year, setYear] = useState(TODAY.getFullYear());
  const [modalInfo, setModalInfo] = useState(null); // { studentId, month }
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("전체");
  const barRef = useRef(null);
  const [theadTop, setTheadTop] = useState(280);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => setTheadTop(100 + el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function monthKey(m) {
    return `${year}-${String(m).padStart(2, "0")}`;
  }

  const filtered = students
    .filter((s) => s.name.includes(search) || s.grade.includes(search));
  const visibleTypes = activeType === "전체" ? CLASS_TYPES : [activeType];
  const groups = visibleTypes
    .map((ct) => ({
      ct,
      list: filtered.filter((s) => (s.classType || "초등부") === ct).sort((a, b) => {
        const withdrawnDiff = (a.status === "withdrawn" ? 1 : 0) - (b.status === "withdrawn" ? 1 : 0);
        if (withdrawnDiff !== 0) return withdrawnDiff;
        return gradeSortKey(a.grade) - gradeSortKey(b.grade);
      }),
    }))
    .filter((g) => g.list.length > 0);
  const displayedStudents = groups.flatMap((g) => g.list);

  return (
    <div>
      <div ref={barRef} style={{ position: "sticky", top: 100, left: 0, zIndex: 25, background: C.bg, paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.border}` }}>
          <button onClick={() => setYear((y) => y - 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>‹</button>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{year}년 수강료 현황</div>
          <button onClick={() => setYear((y) => y + 1)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.inkMuted, fontSize: 18 }}>›</button>
        </div>

        <div style={{ fontSize: 12, color: C.inkMuted, margin: "8px 0", paddingLeft: 2 }}>
          💡 칸을 클릭하면 납부일과 납부 방법을 입력·수정할 수 있습니다
        </div>

        <div style={{ position: "relative", marginBottom: 10, width: "50%" }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, minWidth: 0 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: C.inkMuted, fontWeight: 600 }}>총 {filtered.length}명</span>
          </div>
        </div>
      </div>

      {displayedStudents.length === 0 ? (
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginTop: 12 }}>
          <EmptyState text="검색 결과가 없습니다." />
        </div>
      ) : (
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginTop: 12 }}>
          <table style={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                <th style={{ width: 70, padding: "10px 4px", fontSize: 12, color: C.inkMuted, textAlign: "center", borderRight: `1px solid ${C.border}`, position: "sticky", top: theadTop, zIndex: 15, background: C.bg, borderTopLeftRadius: 12 }}>학생</th>
                {MONTHS.map((m) => (
                  <th key={m} style={{ width: 70, padding: "10px 1px", fontSize: 11, color: C.inkMuted, textAlign: "center", position: "sticky", top: theadTop, zIndex: 15, background: C.bg, ...(m === 12 ? { borderTopRightRadius: 12 } : {}) }}>{m}월</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.ct}>
                  <tr style={{ background: C.bg }}>
                    <td colSpan={13} style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, color: C.ink, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}` }}>
                      {g.ct} <span style={{ fontWeight: 500, color: C.inkMuted }}>{g.list.length}명</span>
                    </td>
                  </tr>
                  {g.list.map((student, idx) => (
                    <tr key={student.id} style={{ borderBottom: idx === g.list.length - 1 ? "none" : `1px solid ${C.border}`, opacity: student.status === "withdrawn" ? 0.45 : 1 }}>
                      <td
                        onClick={() => onSelectStudent(student)}
                        style={{ padding: "10px 4px", cursor: "pointer", borderRight: `1px solid ${C.border}`, overflow: "hidden", textAlign: "center" }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 16, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{student.name}</div>
                        <div style={{ fontSize: 10, color: C.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>
                          {student.grade}{student.status === "withdrawn" && " · 퇴원"}
                        </div>
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
                                <div style={{ fontSize: 11, color: C.ink, fontWeight: 700, lineHeight: 1.5 }}>{((payment.amount ?? student.fee) / 10000).toFixed(0)}만</div>
                                {payment.note && <div style={{ fontSize: 9, color: C.inkMuted, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📝{payment.note}</div>}
                              </div>
                            ) : (
                              <span style={{ color: C.border, fontSize: 17 }}>○</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: C.bg, borderTop: `2px solid ${C.border}` }}>
                <td style={{ padding: "10px 4px", fontSize: 12, fontWeight: 700, color: C.ink, textAlign: "center", borderRight: `1px solid ${C.border}`, borderBottomLeftRadius: 12 }}>
                  합계
                </td>
                {MONTHS.map((m) => {
                  const key = monthKey(m);
                  const total = displayedStudents.reduce((sum, s) => {
                    const payment = s.payments.find((p) => p.month === key);
                    return payment && payment.paid ? sum + (payment.amount ?? s.fee) : sum;
                  }, 0);
                  return (
                    <td key={m} style={{ padding: "8px 1px", textAlign: "center", fontSize: 12, fontWeight: 700, color: C.accent, ...(m === 12 ? { borderBottomRightRadius: 12 } : {}) }}>
                      {total > 0 ? `${total.toLocaleString()}원` : "-"}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

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
  const [paidAt, setPaidAt] = useState(existing?.paidAt || `${month}-01`);
  const [method, setMethod] = useState(existing?.method || "카드");
  const [amount, setAmount] = useState(existing?.amount ?? student.fee);
  const [note, setNote] = useState(existing?.note || "");

  const [y, m] = month.split("-");
  const monthLabel = `${y}년 ${Number(m)}월`;

  function handleSave() {
    setPayment(student.id, month, { paid: true, paidAt, method, amount: Number(amount), note });
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
        <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>금액</div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.bg, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>납부일</div>
        <input
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
          onClick={(e) => e.target.showPicker?.()}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.bg, cursor: "pointer" }}
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

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>메모 (예: 카드 5만+현금 5만)</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="나눠 낸 경우 등 상세 내역"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.bg, boxSizing: "border-box" }}
        />
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
