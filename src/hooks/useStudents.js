// 학생 데이터 훅 — Supabase 연동 버전 (CRUD + 출석/납부 관리, 보강/반 구분/납부방법 지원)
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { fmtFullDate } from "../constants.js";

// DB(snake_case) 행을 앱에서 쓰는 형태(camelCase)로 변환
function fromDbStudent(row) {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    phone: row.phone,
    parentPhone: row.parent_phone,
    registeredAt: row.registered_at,
    type: row.type,
    fee: row.fee,
    totalSessions: row.total_sessions,
    usedSessions: row.used_sessions,
    days: row.days || [],
    memo: row.memo,
    classType: row.class_type,
    status: row.status || "active",
  };
}

// 앱에서 쓰는 형태(camelCase)를 DB(snake_case)로 변환
function toDbStudent(data) {
  return {
    name: data.name,
    grade: data.grade,
    phone: data.phone,
    parent_phone: data.parentPhone,
    registered_at: data.registeredAt,
    type: data.type,
    fee: data.fee,
    total_sessions: data.totalSessions,
    used_sessions: data.usedSessions,
    days: data.days,
    memo: data.memo,
    class_type: data.classType,
    status: data.status || "active",
  };
}

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const pendingToggles = useRef(new Set()); // 처리 중인 출석 토글 중복 클릭 방지

  const loadStudents = useCallback(async () => {
    setLoading(true);

    const { data: studentRows, error } = await supabase
      .from("students")
      .select("*")
      .order("id");

    if (error) {
      console.error("학생 목록 로드 실패:", error);
      setLoading(false);
      return;
    }

    const { data: attendanceRows } = await supabase.from("attendance").select("*");
    const { data: paymentRows } = await supabase.from("payments").select("*");

    const merged = (studentRows || []).map((row) => {
      const student = fromDbStudent(row);

      const attendance = {};
      (attendanceRows || [])
        .filter((a) => a.student_id === student.id)
        .forEach((a) => { attendance[a.date] = a.is_makeup ? "makeup" : true; });

      const payments = (paymentRows || [])
        .filter((p) => p.student_id === student.id)
        .map((p) => ({ month: p.month, paid: p.paid, paidAt: p.paid_at, method: p.method, amount: p.amount, note: p.note }));

      return { ...student, attendance, payments };
    });

    setStudents(merged);
    setLoading(false);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // 출석 토글 — isMakeup이 true면 보강으로 기록, 횟수제는 usedSessions 자동 증감
  async function toggleAttendance(studentId, dateStr, isMakeup = false) {
    const key = `${studentId}`; // 학생 단위로 잠가서 다른 날짜 칸도 순차 처리되게 함
    if (pendingToggles.current.has(key)) return; // 처리 중이면 중복 클릭 무시
    pendingToggles.current.add(key);

    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      const isAttending = !!student.attendance[dateStr];

      if (isAttending) {
        await supabase.from("attendance").delete().eq("student_id", studentId).eq("date", dateStr);
      } else {
        await supabase.from("attendance").insert({ student_id: studentId, date: dateStr, is_makeup: isMakeup });
      }

      if (student.type === "횟수제") {
        const nextUsed = Math.max(0, (student.usedSessions || 0) + (isAttending ? -1 : 1));
        await supabase.from("students").update({ used_sessions: nextUsed }).eq("id", studentId);
      }

      await loadStudents();
    } finally {
      pendingToggles.current.delete(key);
    }
  }

  // 수강료 납부 토글 (기존 방식 — 상세 모달 등에서 사용)
  async function togglePayment(studentId, month) {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const existing = student.payments.find((p) => p.month === month);
    const today = fmtFullDate(new Date());

    if (!existing) {
      await supabase.from("payments").insert({ student_id: studentId, month, paid: true, paid_at: today });
    } else if (existing.paid) {
      await supabase.from("payments").update({ paid: false, paid_at: null, method: null }).eq("student_id", studentId).eq("month", month);
    } else {
      await supabase.from("payments").update({ paid: true, paid_at: today }).eq("student_id", studentId).eq("month", month);
    }

    await loadStudents();
  }

  // 수강료 납부 정보를 날짜/방법까지 직접 지정해서 저장 (1년 전체 보기 화면에서 사용)
  async function setPayment(studentId, month, { paid, paidAt, method, amount, note }) {
  const student = students.find((s) => s.id === studentId);
  if (!student) return;
  const existing = student.payments.find((p) => p.month === month);
  if (!paid) {
    await supabase.from("payments").delete().eq("student_id", studentId).eq("month", month);
  } else if (existing) {
    await supabase.from("payments").update({ paid: true, paid_at: paidAt, method, amount, note }).eq("student_id", studentId).eq("month", month);
  } else {
    await supabase.from("payments").insert({ student_id: studentId, month, paid: true, paid_at: paidAt, method, amount, note });
  }
  // 횟수제 학생이 결제 확인되면 회차 카운트 자동 리셋
  if (paid && student.type === "횟수제") {
    await supabase.from("students").update({ used_sessions: 0 }).eq("id", studentId);
  }
  await loadStudents();
}

  // 학생 추가
  async function addStudent(data) {
    await supabase.from("students").insert(toDbStudent(data));
    await loadStudents();
  }

  // 학생 수정
  async function updateStudent(updated) {
    await supabase.from("students").update(toDbStudent(updated)).eq("id", updated.id);
    await loadStudents();
  }

 // 학생 삭제
async function deleteStudent(studentId) {
  await supabase.from("students").delete().eq("id", studentId);
  await loadStudents();
}

 // 퇴원/재원 처리
async function setStudentStatus(studentId, status) {
  await supabase.from("students").update({ status }).eq("id", studentId);
  await loadStudents();
}

return { students, loading, toggleAttendance, togglePayment, setPayment, addStudent, updateStudent, deleteStudent, setStudentStatus };
}
