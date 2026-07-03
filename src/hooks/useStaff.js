// 보조요원 데이터 훅 — Supabase 연동 버전 (CRUD + 출퇴근 관리)
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStaff = useCallback(async () => {
    setLoading(true);

    const { data: staffRows, error } = await supabase
      .from("staff")
      .select("*")
      .order("id");

    if (error) {
      console.error("직원 목록 로드 실패:", error);
      setLoading(false);
      return;
    }

    const { data: attendanceRows } = await supabase.from("staff_attendance").select("*");

    const merged = (staffRows || []).map((row) => {
      const attendance = {};
      (attendanceRows || [])
        .filter((a) => a.staff_id === row.id)
        .forEach((a) => {
          attendance[a.date] = {
            clockIn: a.clock_in,
            clockOut: a.clock_out,
            memo: a.memo,
          };
        });

      return { ...row, attendance };
    });

    setStaff(merged);
    setLoading(false);
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  // 날짜별 출퇴근 기록 설정 — record가 null이면 그 날짜 기록 삭제, 아니면 병합
  async function setAttendance(staffId, dateStr, record) {
    if (record === null) {
      await supabase.from("staff_attendance").delete().eq("staff_id", staffId).eq("date", dateStr);
    } else {
      const staffMember = staff.find((s) => s.id === staffId);
      const existing = staffMember?.attendance[dateStr] || {};
      const merged = { ...existing, ...record };
      await supabase.from("staff_attendance").upsert(
        { staff_id: staffId, date: dateStr, clock_in: merged.clockIn, clock_out: merged.clockOut, memo: merged.memo },
        { onConflict: "staff_id,date" }
      );
    }

    await loadStaff();
  }

  // 직원 추가
  async function addStaff(data) {
    await supabase.from("staff").insert({
      name: data.name,
      role: data.role,
      phone: data.phone,
      memo: data.memo,
    });
    await loadStaff();
  }

  // 직원 수정
  async function updateStaff(updated) {
    await supabase.from("staff").update({
      name: updated.name,
      role: updated.role,
      phone: updated.phone,
      memo: updated.memo,
    }).eq("id", updated.id);
    await loadStaff();
  }

  // 직원 삭제
  async function deleteStaff(staffId) {
    await supabase.from("staff").delete().eq("id", staffId);
    await loadStaff();
  }

  return { staff, loading, setAttendance, addStaff, updateStaff, deleteStaff };
}
