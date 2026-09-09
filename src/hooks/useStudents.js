// 학생 데이터 훅 — Supabase 연동 버전 (CRUD + 출석/납부 관리, 보강/반 구분/납부방법 지원)
// ★ 회차(session) 계산은 "session_config_history" 이력 기반 구간 계산 방식 사용
// ★ 요일(days) 계산도 "day_config_history" 이력 기반 구간 계산 방식 사용
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
    days: row.days || [],
    memo: row.memo,
    classType: row.class_type,
    status: row.status || "active",
    activeFrom: row.active_from || null,
    withdrawnAt: row.withdrawn_at || null,
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
    days: data.days,
    memo: data.memo,
    class_type: data.classType,
    status: data.status || "active",
  };
}

// 학생의 회차 설정 이력(effective_from 오름차순)을 기준으로,
// 출석 기록을 "구간"별로 나누고, 각 구간 안에서만 날짜순으로 회차 번호를 계산한다.
// history: [{ effectiveFrom: "YYYY-MM-DD", totalSessions: N }, ...] (이미 오름차순 정렬된 상태로 전달됨)
// attendanceDates: 그 학생의 출석된 날짜 문자열 배열 (makeup 포함, 정렬 전)
function computeSessionNumbers(history, attendanceDates) {
  const result = {}; // { dateStr: sessionNumber }
  if (!history || history.length === 0) return result;

  const sortedDates = [...attendanceDates].sort();

  // 각 출석일이 속하는 구간(index)을 찾는 헬퍼
  function findSegmentIndex(dateStr) {
    let idx = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i].effectiveFrom <= dateStr) idx = i;
      else break;
    }
    return idx;
  }

  // 구간별로 날짜를 묶는다
  const segmentBuckets = history.map(() => []);
  sortedDates.forEach((dateStr) => {
    const segIdx = findSegmentIndex(dateStr);
    segmentBuckets[segIdx].push(dateStr);
  });

  // 구간별로 순번 계산
  segmentBuckets.forEach((dates, segIdx) => {
    const total = history[segIdx].totalSessions;
    dates.forEach((dateStr, i) => {
      result[dateStr] = (i % total) + 1;
    });
  });

  return result;
}

// "진행 회차 / 잔여 횟수 / 마감 여부"는 항상 "현재(=가장 마지막) 구간" 기준으로 계산한다.
// 주의: sessionNumbers 전체에서 "가장 최근 출석일"을 그냥 가져오면 안 된다 —
// 총 횟수를 방금 바꿔서 새 구간이 시작된 직후, 아직 그 구간에 출석 기록이 하나도 없다면
// "가장 최근 출석일"은 여전히 예전 구간(예: 8회 기준)의 마지막 날짜를 가리키게 되어
// 화면에 예전 회차 숫자가 그대로 남아있는 것처럼 보이는 버그가 있었음.
// 그래서 여기서는 "현재 구간의 시작일(effectiveFrom) 이후" 출석만 세어서 계산한다.
function computeCurrentCycleInfo(history, attendanceDates) {
  if (!history || history.length === 0) {
    return { currentSessionNumber: null, remainingSessions: null, isExhausted: false };
  }
  const currentSegment = history[history.length - 1]; // history는 effective_from 오름차순 정렬되어 전달됨
  const total = currentSegment.totalSessions;
  const datesInCurrentSegment = attendanceDates.filter((d) => d >= currentSegment.effectiveFrom).sort();

  if (datesInCurrentSegment.length === 0) {
    // 새 구간이 시작됐지만 아직 그 구간에 출석 기록이 없음 → 처음부터 다시 시작
    return { currentSessionNumber: null, remainingSessions: total, isExhausted: false };
  }

  const currentSessionNumber = ((datesInCurrentSegment.length - 1) % total) + 1;
  return {
    currentSessionNumber,
    remainingSessions: Math.max(0, total - currentSessionNumber),
    isExhausted: currentSessionNumber === total,
  };
}

// 요일 변경 이력을 기준으로, 특정 날짜에 적용되던 수업 요일을 계산
// history: [{ effectiveFrom, days }, ...] (오름차순 정렬됨)
function computeDaysAt(history, dateStr, fallbackDays) {
  if (!history || history.length === 0) return fallbackDays;
  let applicable = null;
  for (let i = 0; i < history.length; i++) {
    if (history[i].effectiveFrom <= dateStr) applicable = history[i];
    else break;
  }
  return applicable ? applicable.days : [];
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
    const { data: historyRows } = await supabase
      .from("session_config_history")
      .select("*")
      .order("effective_from", { ascending: true });
    const { data: dayHistoryRows } = await supabase
      .from("day_config_history")
      .select("*")
      .order("effective_from", { ascending: true });

    const merged = (studentRows || []).map((row) => {
      const student = fromDbStudent(row);

      const attendance = {};
      const attendanceDates = [];
      (attendanceRows || [])
        .filter((a) => a.student_id === student.id)
        .forEach((a) => {
          attendance[a.date] = a.is_makeup ? "makeup" : true;
          attendanceDates.push(a.date);
        });

      const history = (historyRows || [])
        .filter((h) => h.student_id === student.id)
        .map((h) => ({ effectiveFrom: h.effective_from, totalSessions: h.total_sessions }));

      const dayHistory = (dayHistoryRows || [])
        .filter((h) => h.student_id === student.id)
        .map((h) => ({ effectiveFrom: h.effective_from, days: h.days || [], classType: h.class_type }));

      const sessionNumbers = student.type === "횟수제" ? computeSessionNumbers(history, attendanceDates) : {};
      const { currentSessionNumber, remainingSessions, isExhausted } =
        student.type === "횟수제"
          ? computeCurrentCycleInfo(history, attendanceDates)
          : { currentSessionNumber: null, remainingSessions: null, isExhausted: false };

      const payments = (paymentRows || [])
        .filter((p) => p.student_id === student.id)
        .map((p) => ({ month: p.month, paid: p.paid, paidAt: p.paid_at, method: p.method, amount: p.amount, note: p.note }));

      return {
        ...student, attendance, sessionNumbers, sessionHistory: history, dayHistory, payments,
        currentSessionNumber, remainingSessions, isExhausted,
      };
    });

    setStudents(merged);
    setLoading(false);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // 특정 학생의 특정 날짜 기준 수업 요일을 계산 (요일 변경 이력 반영)
  function getDaysAt(student, dateStr) {
    return computeDaysAt(student.dayHistory, dateStr, student.days);
  }

  // 출석 토글 — isMakeup이 true면 보강으로 기록.
  // 회차 번호(N회)와 잔여/마감 여부는 별도로 저장하지 않고,
  // loadStudents() 시점에 attendance 테이블 + 이력을 기준으로 항상 재계산되므로
  // 순서·삭제·정정과 무관하게 항상 정확하고 서로 일치함.
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
    await loadStudents();
  }

  // 학생 추가
  async function addStudent(data) {
    const { data: inserted, error } = await supabase.from("students").insert(toDbStudent(data)).select().single();
    if (!error && inserted) {
      if (data.type === "횟수제") {
        // 신규 학생은 등록일부터 지정한 횟수로 회차 이력 1건 자동 생성
        await supabase.from("session_config_history").insert({
          student_id: inserted.id,
          effective_from: data.registeredAt,
          total_sessions: data.totalSessions,
        });
      }
      // 신규 학생은 등록일부터 지정한 요일로 요일 이력 1건 자동 생성
      await supabase.from("day_config_history").insert({
        student_id: inserted.id,
        effective_from: data.registeredAt,
        days: data.days,
        class_type: data.classType,
      });
    }
    await loadStudents();
  }

  // 학생 수정
  async function updateStudent(updated) {
    await supabase.from("students").update(toDbStudent(updated)).eq("id", updated.id);
    await loadStudents();
  }

  // 회차(횟수) 변경 이력 추가 — 특정 날짜부터 새 총 횟수를 적용
  async function addSessionConfigChange(studentId, newTotalSessions, effectiveFrom) {
    await supabase.from("session_config_history").insert({
      student_id: studentId,
      effective_from: effectiveFrom,
      total_sessions: newTotalSessions,
    });
    await loadStudents();
  }

  // 요일 변경 이력 추가 — 특정 날짜부터 새 요일(및 반 구분)을 적용
  async function addDayConfigChange(studentId, newDays, effectiveFrom, classType) {
    await supabase.from("day_config_history").insert({
      student_id: studentId,
      effective_from: effectiveFrom,
      days: newDays,
      class_type: classType,
    });
    await loadStudents();
  }

  // 학생 삭제
  async function deleteStudent(studentId) {
    await supabase.from("students").delete().eq("id", studentId);
    await loadStudents();
  }

  // 퇴원/재원 처리 (재원 처리 시 재원 시작일을 함께 저장)
  async function setStudentStatus(studentId, status, dateValue = null) {
    const update = { status };
    if (status === "active") {
      update.active_from = dateValue || fmtFullDate(new Date());
    } else if (status === "withdrawn") {
      update.withdrawn_at = dateValue || fmtFullDate(new Date());
    }
    await supabase.from("students").update(update).eq("id", studentId);
    await loadStudents();
  }

  return {
    students, loading, toggleAttendance, togglePayment, setPayment,
    addStudent, updateStudent, deleteStudent, setStudentStatus,
    addSessionConfigChange, addDayConfigChange, getDaysAt,
  };
}
