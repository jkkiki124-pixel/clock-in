// 공통 UI 컴포넌트 모음
import { C, inputStyle } from "../constants.js";

export function Badge({ text, color, bg }) {
  return (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, borderRadius: 5, padding: "2px 7px" }}>
      {text}
    </span>
  );
}

export function EmptyState({ text }) {
  return (
    <div style={{ padding: "32px 16px", textAlign: "center", color: C.inkMuted, fontSize: 14 }}>
      {text}
    </div>
  );
}

export function FormField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, letterSpacing: 1, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ background: C.bg, borderRadius: 10, padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

export function InfoGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ fontSize: 11, color: C.inkMuted }}>{item.label}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: item.highlight ? C.accent : C.ink }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SummaryCard({ label, value, color, bg, icon }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: 12, border: "1px solid " + color + "22" }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export function SectionTitle({ children, color }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 14, color: color || C.ink, marginBottom: 8, paddingLeft: 2 }}>
      {children}
    </div>
  );
}

const ALL_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function DayPicker({ selected, onChange }) {
  function toggle(day) {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  }
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {ALL_DAYS.map((day) => {
        const active = selected.includes(day);
        return (
          <button
            key={day}
            onClick={() => toggle(day)}
            style={{
              padding: "6px 10px", borderRadius: 8,
              border: "1px solid " + (active ? C.accent : C.border),
              background: active ? C.accentLight : "transparent",
              color: active ? C.accent : C.inkMuted,
              fontWeight: 600, fontSize: 14,
            }}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

const CLASS_TYPES = ["유치부", "초등부", "중고등부", "성인반"];

export function ClassTypePicker({ selected, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {CLASS_TYPES.map((ct) => {
        const active = selected === ct;
        return (
          <button
            key={ct}
            onClick={() => onChange(ct)}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid " + (active ? C.accent : C.border),
              background: active ? C.accent : "transparent",
              color: active ? "#fff" : C.inkMuted,
              fontWeight: 600, fontSize: 14,
            }}
          >
            {ct}
          </button>
        );
      })}
    </div>
  );
}

const GRADE_OPTIONS = [
  "5세", "6세", "7세",
  "초1", "초2", "초3", "초4", "초5", "초6",
  "중1", "중2", "중3",
  "고1", "고2", "고3",
  "성인",
];

const FEE_OPTIONS = [80000, 100000, 120000, 130000, 140000, 170000, 200000];

export function StudentForm({ form, setForm, onSubmit, submitLabel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormField label="반 구분 *">
        <ClassTypePicker selected={form.classType} onChange={(classType) => setForm({ ...form, classType })} />
      </FormField>
      <FormField label="이름 *">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" style={inputStyle} />
      </FormField>
      <FormField label="학년">
        <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} style={inputStyle}>
          <option value="">선택 안 함</option>
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </FormField>
      <FormField label="연락처">
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" style={inputStyle} />
      </FormField>
      <FormField label="학부모 연락처">
        <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="010-0000-0000" style={inputStyle} />
      </FormField>
      <FormField label="등록일">
        <input type="date" value={form.registeredAt} onChange={(e) => setForm({ ...form, registeredAt: e.target.value })} style={inputStyle} />
      </FormField>
      <FormField label="수강 유형">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
          <option value="월정액">월정액</option>
          <option value="횟수제">횟수제</option>
        </select>
      </FormField>
      <FormField label="수강료">
        <select value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} style={inputStyle}>
          {FEE_OPTIONS.map((f) => (
            <option key={f} value={f}>{f.toLocaleString()}원</option>
          ))}
        </select>
      </FormField>
      {form.type === "횟수제" && (
        <FormField label="총 횟수">
          <input type="number" value={form.totalSessions || 10} onChange={(e) => setForm({ ...form, totalSessions: Number(e.target.value) })} style={inputStyle} />
        </FormField>
      )}
      <FormField label="수업 요일">
        <DayPicker selected={form.days} onChange={(days) => setForm({ ...form, days })} />
      </FormField>
      <FormField label="메모">
        <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} rows={2} placeholder="특이사항, 수업 스타일 등" style={{ ...inputStyle, resize: "vertical" }} />
      </FormField>
      <button onClick={onSubmit} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, marginTop: 4 }}>
        {submitLabel}
      </button>
    </div>
  );
}

export function BottomSheet({ onClose, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 12px" }}
      onClick={onClose}
    >
      <div
        style={{ background: C.surface, borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "85vh", overflowY: "auto", padding: "24px 20px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        {children}
      </div>
    </div>
  );
}

export function Dialog({ children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.surface, borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {children}
      </div>
    </div>
  );
}
