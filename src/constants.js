// 전역 상수 — 색상·날짜 유틸·초기 샘플 데이터

// ─── 날짜 ─────────────────────────────────────────────────
export const TODAY = new Date();
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const KR_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtFullDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getWeekDates(baseDate) {
  const d = new Date(baseDate);
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    return date;
  });
}

export function fmtMonth(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const C = {
  bg:           "#F7F4EF",
  surface:      "#FFFFFF",
  border:       "#E5DDD4",
  ink:          "#2B2318",
  inkMuted:     "#7A6E65",
  accent:       "#C1440E",
  accentLight:  "#F9EDE8",
  green:        "#2E7D5B",
  greenLight:   "#E8F5EE",
  yellow:       "#B07D00",
  yellowLight:  "#FFF8E1",
  blue:         "#1A56A0",
  blueLight:    "#EAF1FD",
};

export const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans KR', sans-serif; background: #F7F4EF; color: #2B2318; -webkit-tap-highlight-color: transparent; }
  button { cursor: pointer; font-family: inherit; }
  input, select, textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #F7F4EF; }
  ::-webkit-scrollbar-thumb { background: #E5DDD4; border-radius: 3px; }
`;

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #E5DDD4",
  fontSize: 14,
  outline: "none",
  background: "#F7F4EF",
};

export const menuItemStyle = {
  display: "block",
  width: "100%",
  padding: "11px 16px",
  background: "none",
  border: "none",
  textAlign: "left",
  fontSize: 14,
  fontWeight: 500,
  color: "#2B2318",
  cursor: "pointer",
};

export const INITIAL_STUDENTS = [
  {
    id: 1,
    name: "김민서",
    grade: "초3",
    phone: "010-1234-5678",
    parentPhone: "010-9876-5432",
    registeredAt: "2025-03-02",
    type: "월정액",
    fee: 150000,
    days: ["월", "수", "금"],
    memo: "수채화 집중 수업",
    attendance: {},
    payments: [
      { month: "2026-05", paid: true, paidAt: "2026-05-02" },
      { month: "2026-06", paid: true, paidAt: "2026-06-01" },
    ],
  },
  {
    id: 2,
    name: "이준혁",
    grade: "중1",
    phone: "010-2222-3333",
    parentPhone: "010-4444-5555",
    registeredAt: "2025-09-01",
    type: "횟수제",
    totalSessions: 12,
    usedSessions: 7,
    fee: 180000,
    days: ["화", "목"],
    memo: "",
    attendance: {},
    payments: [
      { month: "2026-06", paid: false, paidAt: null },
    ],
  },
  {
    id: 3,
    name: "박소연",
    grade: "초5",
    phone: "010-5555-6666",
    parentPhone: "010-7777-8888",
    registeredAt: "2026-01-10",
    type: "횟수제",
    totalSessions: 8,
    usedSessions: 3,
    fee: 120000,
    days: ["월", "목"],
    memo: "데생 기초",
    attendance: {},
    payments: [
      { month: "2026-06", paid: true, paidAt: "2026-06-05" },
    ],
  },
  {
    id: 4,
    name: "최도윤",
    grade: "고1",
    phone: "010-3333-7777",
    parentPhone: "",
    registeredAt: "2026-02-15",
    type: "월정액",
    fee: 200000,
    days: ["월", "화", "수", "목", "금"],
    memo: "입시 준비",
    attendance: {},
    payments: [
      { month: "2026-05", paid: true, paidAt: "2026-05-01" },
      { month: "2026-06", paid: false, paidAt: null },
    ],
  },
  {
    id: 5,
    name: "정하은",
    grade: "초2",
    phone: "010-6666-1111",
    parentPhone: "010-2222-9999",
    registeredAt: "2026-04-01",
    type: "횟수제",
    totalSessions: 10,
    usedSessions: 10,
    fee: 150000,
    days: ["수", "금"],
    memo: "색연필·크레파스",
    attendance: {},
    payments: [
      { month: "2026-06", paid: false, paidAt: null },
    ],
  },
];
