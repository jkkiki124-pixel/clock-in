// 달력 메모(방학 등) 저장/불러오기 훅 — Supabase 연동 (날짜별 여러 개 메모 지원)
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useCalendarNotes() {
  const [notes, setNotes] = useState({}); // { [dateStr]: [{ id, note }, ...] }
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("calendar_notes")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      console.error("메모 로드 실패:", error);
      setLoading(false);
      return;
    }
    const map = {};
    (data || []).forEach((row) => {
      if (!map[row.date]) map[row.date] = [];
      map[row.date].push({ id: row.id, note: row.note });
    });
    setNotes(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // 새 메모 추가
  async function addNote(dateStr, text) {
    if (!text || !text.trim()) return;
    const { error } = await supabase.from("calendar_notes").insert({ date: dateStr, note: text.trim() });
    if (error) { console.error("메모 추가 실패:", error); return; }
    await loadNotes();
  }

  // 기존 메모 수정 (빈 값이면 삭제)
  async function updateNote(id, text) {
    if (!text || !text.trim()) {
      await deleteNote(id);
      return;
    }
    const { error } = await supabase.from("calendar_notes").update({ note: text.trim() }).eq("id", id);
    if (error) { console.error("메모 수정 실패:", error); return; }
    await loadNotes();
  }

  // 메모 삭제
  async function deleteNote(id) {
    const { error } = await supabase.from("calendar_notes").delete().eq("id", id);
    if (error) { console.error("메모 삭제 실패:", error); return; }
    await loadNotes();
  }

  return { notes, loading, addNote, updateNote, deleteNote };
}
