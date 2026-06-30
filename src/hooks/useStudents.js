// 학생 데이터 훅 — CRUD 액션 + localStorage 영구저장
import { useState, useEffect } from "react";
import { INITIAL_STUDENTS, fmtFullDate } from "../constants.js";

const STORAGE_KEY = "artschool_students";

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_STUDENTS;
}

function saveStudents(students) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); }
  catch {}
}

export function useStudents() {
  const [students, setStudents] = useState(loadStudents);

  // students가 바뀔 때마다 localStorage에 저장
  useEffect(() => { saveStudents(students); }, [students]);

  // 출석 토글 — 횟수제는 usedSessions 자동 증감
  function toggleAttendance(studentId, dateStr) {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const att = { ...s.attendance };
        if (att[dateStr]) {
          delete att[dateStr];
          return s.type === "횟수제"
            ? { ...s, attendance: att, usedSessions: Math.max(0, (s.usedSessions || 0) - 1) }
            : { ...s, attendance: att };
        }
        att[dateStr] = true;
        return s.type === "횟수제"
          ? { ...s, attendance: att, usedSessions: (s.usedSessions || 0) + 1 }
          : { ...s, attendance: att };
      })
    );
  }

  // 수강료 납부 토글
  function togglePayment(studentId, month) {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const today = fmtFullDate(new Date());
        // 해당 월 납부 기록이 없으면 새로 추가
        const hasRecord = s.payments.some((p) => p.month === month);
        if (!hasRecord) {
          return { ...s, payments: [...s.payments, { month, paid: true, paidAt: today }] };
        }
        return {
          ...s,
          payments: s.payments.map((p) =>
            p.month !== month ? p
              : p.paid ? { ...p, paid: false, paidAt: null }
                       : { ...p, paid: true,  paidAt: today }
          ),
        };
      })
    );
  }

  // 학생 추가
  function addStudent(data) {
    setStudents((prev) => [
      ...prev,
      { ...data, id: Date.now(), attendance: {}, payments: [] },
    ]);
  }

  // 학생 수정
  function updateStudent(updated) {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  // 학생 삭제
  function deleteStudent(studentId) {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  }

  return { students, toggleAttendance, togglePayment, addStudent, updateStudent, deleteStudent };
}
