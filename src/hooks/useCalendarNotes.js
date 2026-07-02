// 달력 메모(방학 등) 저장/불러오기 훅 — Supabase 연동
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useCalendarNotes() {
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("calendar_notes").select("*");
    if (error) {
      console.error("메모 로드 실패:", error);
      setLoading(false);
      return;
    }
    const map = {};
    (data || []).forEach((row) => {
      map[row.date] = row.note;
    });
    setNotes(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  async function setNote(dateStr, text) {
    if (!text || !text.trim()) {
      await supabase.from("calendar_notes").delete().eq("date", dateStr);
    } else {
      const { data: existing } = await supabase
        .from("calendar_notes")
        .select("id")
        .eq("date", dateStr)
        .maybeSingle();
      if (existing) {
        await supabase.from("calendar_notes").update({ note: text }).eq("date", dateStr);
      } else {
        await supabase.from("calendar_notes").insert({ date: dateStr, note: text });
      }
    }
    await loadNotes();
  }

  return { notes, loading, setNote };
}
