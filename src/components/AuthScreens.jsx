// 인증 화면 컴포넌트 — 잠금 화면 + 비밀번호 설정/변경 모달
import { useState, useEffect, useRef } from "react";
import { C, inputStyle } from "../constants.js";
import { Dialog, FormField } from "./ui.jsx";

// ─── 잠금 화면 ────────────────────────────────────────────
export function LockScreen({ onLogin }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef          = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit() {
    if (!onLogin(pw)) {
      setError("비밀번호가 틀렸습니다.");
      setShake(true);
      setPw("");
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          20%    { transform:translateX(-8px) }
          40%    { transform:translateX(8px) }
          60%    { transform:translateX(-6px) }
          80%    { transform:translateX(6px) }
        }
        .shake { animation: shake 0.4s ease; }
      `}</style>
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #2B2318 0%, #4a3728 100%)",
        padding: 24,
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🎨</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 22, marginBottom: 4 }}>미술학원 관리</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>관리자 전용</div>
        </div>

        <div className={shake ? "shake" : ""} style={{
          background: C.surface, borderRadius: 16, padding: "28px 24px",
          width: "100%", maxWidth: 340,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 18 }}>🔐 비밀번호 입력</div>
          <input
            ref={inputRef}
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="비밀번호"
            style={{ ...inputStyle, marginBottom: 8, fontSize: 16, letterSpacing: 4 }}
          />
          {error && (
            <div style={{ color: C.accent, fontSize: 13, marginBottom: 10, fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: C.accent, color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 4,
            }}
          >
            입장하기
          </button>
        </div>
      </div>
    </>
  );
}

// ─── 비밀번호 설정/변경 모달 ──────────────────────────────
export function ChangePwModal({ isFirst, onClose, onChangePw }) {
  const [oldPw,     setOldPw]     = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  function handleSubmit() {
    if (newPw.length < 4) { setError("비밀번호는 4자리 이상이어야 합니다."); return; }
    if (newPw !== confirmPw) { setError("새 비밀번호가 일치하지 않습니다."); return; }
    if (!onChangePw(isFirst ? "" : oldPw, newPw)) { setError("현재 비밀번호가 틀렸습니다."); return; }
    setDone(true);
  }

  return (
    <Dialog>
      {done ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
            {isFirst ? "비밀번호 설정 완료" : "비밀번호 변경 완료"}
          </div>
          <div style={{ color: C.inkMuted, fontSize: 14, marginBottom: 20 }}>
            다음부터 이 비밀번호로 로그인하세요.
          </div>
          <button
            onClick={onClose}
            style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 700, fontSize: 15 }}
          >
            확인
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>
              {isFirst ? "🔐 관리자 비밀번호 설정" : "🔑 비밀번호 변경"}
            </div>
            {!isFirst && (
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: C.inkMuted }}>✕</button>
            )}
          </div>

          {isFirst && (
            <div style={{
              background: C.yellowLight, borderRadius: 8, padding: "10px 12px",
              marginBottom: 16, fontSize: 13, color: C.yellow, fontWeight: 500,
            }}>
              처음 실행입니다. 관리자 비밀번호를 설정해주세요.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {!isFirst && (
              <FormField label="현재 비밀번호">
                <input type="password" value={oldPw}
                  onChange={(e) => { setOldPw(e.target.value); setError(""); }}
                  placeholder="현재 비밀번호" style={{ ...inputStyle, letterSpacing: 3 }} />
              </FormField>
            )}
            <FormField label="새 비밀번호 (4자리 이상)">
              <input type="password" value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                placeholder="새 비밀번호" style={{ ...inputStyle, letterSpacing: 3 }} />
            </FormField>
            <FormField label="새 비밀번호 확인">
              <input type="password" value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="비밀번호 재입력" style={{ ...inputStyle, letterSpacing: 3 }} />
            </FormField>

            {error && <div style={{ color: C.accent, fontSize: 13, fontWeight: 500 }}>⚠️ {error}</div>}

            <button onClick={handleSubmit} style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: C.accent, color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 4,
            }}>
              {isFirst ? "비밀번호 설정" : "변경 완료"}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
