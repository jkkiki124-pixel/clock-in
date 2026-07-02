// 앱 루트 — 인증·라우팅·전역 상태만 담당
import { useState, useMemo } from "react";
import { globalStyle, TODAY, getWeekDates } from "./constants.js";
import { useAuth }     from "./hooks/useAuth.js";
import { useStudents } from "./hooks/useStudents.js";
import { useStaff }    from "./hooks/useStaff.js";
import { useCalendarNotes } from "./hooks/useCalendarNotes.js";
import { Header }      from "./components/Header.jsx";
import { LockScreen, ChangePwModal } from "./components/AuthScreens.jsx";
import { AttendanceTab } from "./components/AttendanceTab.jsx";
import { PaymentTab }    from "./components/PaymentTab.jsx";
import { StudentsTab }   from "./components/StudentsTab.jsx";
import { StaffTab }      from "./components/StaffTab.jsx";
import { StudentModal, AddStudentModal } from "./components/StudentModals.jsx";

export default function App() {
  // ── 인증
  const { authed, isFirstRun, changePwOpen, setChangePwOpen, login, logout, changePw } = useAuth();

  // ── 학생 데이터 (Supabase 영구저장)
  const { students, toggleAttendance, togglePayment, setPayment, addStudent, updateStudent, deleteStudent, setStudentStatus } = useStudents();

  // ── 보조요원 데이터
  const { staff, setAttendance, addStaff, updateStaff, deleteStaff } = useStaff();

  // ── 달력 메모(공휴일/방학 등)
  const { notes, setNote } = useCalendarNotes();

  // ── UI 상태
  const [tab,             setTab]             = useState("attendance");
  const [weekOffset,      setWeekOffset]      = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [addOpen,         setAddOpen]         = useState(false);

  const baseDate  = useMemo(() => { const d = new Date(TODAY); d.setDate(d.getDate() + weekOffset * 7); return d; }, [weekOffset]);
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  // 잠금 화면
  if (!authed) {
    return (
      <>
        <style>{globalStyle}</style>
        <LockScreen onLogin={login} />
        {changePwOpen && (
          <ChangePwModal isFirst={isFirstRun} onClose={() => setChangePwOpen(false)} onChangePw={changePw} />
        )}
      </>
    );
  }

  function handleSelectStudent(s) {
    // 항상 최신 데이터로 열기
    setSelectedStudent(students.find((st) => st.id === s.id) || s);
  }

  function handleUpdateStudent(updated) {
    updateStudent(updated);
    setSelectedStudent(updated);
  }

  return (
    <>
      <style>{globalStyle}</style>
      <div style={{ minHeight: "100vh" }}>
        <Header
          ={} set={set}
          onAddStudent={() => setAddOpen(true)}
          onLogout={logout}
          onChangePw={() => setChangePwOpen(true)}
        />

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "16px 12px 80px" }}>
          {tab === "attendance" && (
            <AttendanceTab
              students={students.filter((s) => s.status !== "withdrawn")}
              weekDates={weekDates}
              weekOffset={weekOffset}
              setWeekOffset={setWeekOffset}
              toggleAttendance={toggleAttendance}
              onSelectStudent={handleSelectStudent}
              notes={notes}
              setNote={setNote}
            />
          )}

          {tab === "payment" && (
            <PaymentTab
              students={students.filter((s) => s.status !== "withdrawn")}
              setPayment={setPayment}
              onSelectStudent={handleSelectStudent}
            />
          )}
          {tab === "students" && (
            <StudentsTab
              students={students}
              onSelectStudent={handleSelectStudent}
            />
          )}
          {tab === "staff" && (
            <StaffTab
              staff={staff}
              setAttendance={setAttendance}
              addStaff={addStaff}
              updateStaff={updateStaff}
              deleteStaff={deleteStaff}
            />
          )}
        </main>

        {/* 학생 상세 모달 */}
        {selectedStudent && (
          <StudentModal
            student={students.find((s) => s.id === selectedStudent.id) || selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onUpdate={handleUpdateStudent}
            onDelete={(id) => { deleteStudent(id); setSelectedStudent(null); }}
            togglePayment={togglePayment}
            setStudentStatus={setStudentStatus}
          />
        )}

        {/* 학생 추가 모달 */}
        {addOpen && (
          <AddStudentModal
            onClose={() => setAddOpen(false)}
            onAdd={(data) => { addStudent(data); setAddOpen(false); }}
          />
        )}

        {/* 비밀번호 변경 모달 */}
        {changePwOpen && (
          <ChangePwModal
            isFirst={isFirstRun}
            onClose={() => { if (!isFirstRun) setChangePwOpen(false); }}
            onChangePw={changePw}
          />
        )}
      </div>
    </>
  );
}
