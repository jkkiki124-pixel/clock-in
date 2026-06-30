// 인증 훅 — 비밀번호 로그인·로그아웃·변경 로직
import { useState, useEffect } from "react";

const PW_KEY      = "artschool_admin_pw";
const SESSION_KEY = "artschool_authed";

function getStoredPw()  { try { return localStorage.getItem(PW_KEY); }          catch { return null; } }
function setStoredPw(v) { try { localStorage.setItem(PW_KEY, v); }               catch {} }
function getSession()   { try { return sessionStorage.getItem(SESSION_KEY)==="1";} catch { return false; } }
function setSession(v)  {
  try { v ? sessionStorage.setItem(SESSION_KEY, "1") : sessionStorage.removeItem(SESSION_KEY); }
  catch {}
}

export function useAuth() {
  const [authed,       setAuthed]       = useState(() => !getStoredPw() || getSession());
  const [changePwOpen, setChangePwOpen] = useState(false);
  const isFirstRun = !getStoredPw();

  // 최초 실행이면 비밀번호 설정 유도
  useEffect(() => { if (isFirstRun) setChangePwOpen(true); }, []);

  function login(pw) {
    if (pw === getStoredPw()) { setSession(true); setAuthed(true); return true; }
    return false;
  }

  function logout() { setSession(false); setAuthed(false); }

  function changePw(oldPw, newPw) {
    const stored = getStoredPw();
    if (!stored || oldPw === stored) {
      setStoredPw(newPw);
      setSession(true);
      setAuthed(true);
      setChangePwOpen(false);
      return true;
    }
    return false;
  }

  return { authed, isFirstRun, changePwOpen, setChangePwOpen, login, logout, changePw };
}
