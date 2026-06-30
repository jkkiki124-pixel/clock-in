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
    <div style={{ background: bg, borderRadius: 10, padding: 12, border: `1px solid ${color}22` }}>
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

// 요일 선택 버튼 그룹
const ALL_DAYS = ["월", "화", "수", "목", "금", "토"];

export function DayPicker({ selected, onChange }) {
  function toggle(day) {
    onChange(selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day]);
  }
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {ALL_DAYS.map((day) => (
        <button
          key={day}
          onClick={() => toggle(day)}
          style={{
            padding: "6px 10px", borderRadius: 8,
            border: `1px solid ${selected.includes(day) ? C.accent : C.border}`,
            background: selected.includes(day) ? C.accentLight : "transparent",
            color: selected.includes(day) ? C.accent : C.inkMuted,
            fontWeight: 600, fontSize: 14,
          }}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

// 학생 정보 입력 폼 (추가/수정 공용)
export function StudentForm({ form, setForm, onSubmit, submitLabel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormField label="이름 *">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="홍길동" style={inputStyle} />
      </FormField>
      <FormField label="학년">
        <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
          placeholder="초3, 중1 등" style={inputStyle} />
      </FormField>
      <FormField label="연락처">
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="010-0000-0000" style={inputStyle} />
      </FormField>
      <FormField label="학부모 연락처">
        <input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
          placeholder="010-0000-0000" style={inputStyle} />
      </FormField>
      <FormField label="등록일">
        <input type="date" value={form.registeredAt}
          onChange={(e) => setForm({ ...form, registeredAt: e.target.value })} style={inputStyle} />
      </FormField>
      <FormField label="수강 유형">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
          <option value="월정액">월정액</option>
          <option value="횟수제">횟수제</option>
        </select>
      </FormField>
      <FormField label="수강료 (원)">
        <input type="number" value={form.fee}
          onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} style={inputStyle} />
      </FormField>
      {form.type === "횟수제" && (
        <FormField label="총 횟수">
          <input type="number" value={form.totalSessions || 10}
            onChange={(e) => setForm({ ...form, totalSessions: Number(e.target.value) })} style={inputStyle} />
        </FormField>
      )}
      <FormField label="수업 요일">
        <DayPicker selected={form.days} onChange={(days) => setForm({ ...form, days })} />
      </FormField>
      <FormField label="메모">
        <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })}
          rows={2} placeholder="특이사항, 수업 스타일 등"
          style={{ ...inputStyle, resize: "vertical" }} />
      </FormField>
      <button onClick={onSubmit} style={{
        background: C.accent, color:
