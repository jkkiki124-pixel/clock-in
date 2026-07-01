// 보조요원 데이터 훅 — CRUD + localStorage 저장
import { useState, useEffect } from "react";
import { fmtFullDate } from "../constants.js";

const STORAGE_KEY = "artschool_staff";

const INITIAL_STAFF = [
  {
    id: 1,
    name: "홍길동",
    role: "보조강사",
    phone: "010-0000-0000",
    memo: "",
    attendance: {},
  },
];

function loadStaff() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_STAFF;
}

function saveStaff(staff) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(staff)); }
  catch {}
}

export function useStaff() {
  const [staff, setStaff] = useState(loadStaff);

  useEffect(() => { saveStaff(staff); }, [staff]);

  function setAttendance(staffId, dateStr, record) {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s;
        const att = { ...s.attendance };
        if (record === null) {
          delete att[dateStr];
        } else {
          att[dateStr] = { ...att[dateStr], ...record };
        }
        return { ...s, attendance: att };
      })
    );
  }

  function addStaff(data) {
    setStaff((prev) => [
      ...prev,
      { ...data, id: Date.now(), attendance: {} },
    ]);
  }

  function updateStaff(updated) {
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function deleteStaff(staffId) {
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  }

  return { staff, setAttendance, addStaff, updateStaff, deleteStaff };
}
