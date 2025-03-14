import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import {
  PlusCircle,
  BookOpen,
  LogOut,
  Save,
  Trash2,
  Check,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedBatch, setSelectedBatch] = useState("2022-2026");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2023-2024");
  const [staffName, setStaffName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [showSaveAll, setShowSaveAll] = useState(false);
  const [savedSelections, setSavedSelections] = useState<{
    batch: string;
    section: string;
    semester: number;
    academicYear: string;
  } | null>(null);

  const addSubject = useStore((state) => state.addSubject);
  const subjects = useStore((state) => state.subjects);
  const setUser = useStore((state) => state.setUser);
  const removeSubject = useStore((state) => state.removeSubject);
  const resetSubjects = useStore((state) => state.resetSubjects);
  const saveSubjects = useStore((state) => state.saveSubjects);
  const setBatchAndSection = useStore((state) => state.setBatchAndSection);
  const navigate = useNavigate();

  useEffect(() => {
    setShowSaveAll(subjects.length >= 1);
  }, [subjects.length]);

  useEffect(() => {
    setSubjectName("");
    setSubjectCode("");
    setShowSave(false);
    setSavedSelections(null);
  }, [selectedBatch, selectedSemester, selectedSection, selectedAcademicYear]);

  useEffect(() => {
    setBatchAndSection(selectedBatch, selectedSection);
  }, [selectedBatch, selectedSection, setBatchAndSection]);

  const currentYear = new Date().getFullYear();
  const batches = Array.from(
    { length: 10 },
    (_, i) => `${currentYear - i}-${currentYear - i + 4}`
  );
  const academicYears = Array.from(
    { length: 10 },
    (_, i) => `${currentYear - i}-${currentYear - i + 1}`
  );
  const sections = ["A", "B", "C"];

  const handleInputChange = (
    field: "name" | "code" | "staff",
    value: string
  ) => {
    if (field === "name") {
      setSubjectName(value);
    } else if (field === "code") {
      setSubjectCode(value);
    } else if (field === "staff") {
      setStaffName(value);
    }
    setShowSave(true);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectName.trim() && subjectCode.trim() && staffName.trim()) {
      addSubject({
        id: `${Date.now()}-${selectedSection}`,
        name: subjectName,
        code: subjectCode,
        semester: selectedSemester,
        batch: selectedBatch,
        section: selectedSection,
        staffName: staffName,
        academicYear: selectedAcademicYear,
      });
      setSubjectName("");
      setSubjectCode("");
      setStaffName("");
      setShowSave(false);
    }
  };

  const handleDeleteSubject = (subjectToDelete: {
    code: string;
    name: string;
  }) => {
    subjects
      .filter(
        (subject) =>
          subject.code === subjectToDelete.code &&
          subject.name === subjectToDelete.name &&
          subject.semester === selectedSemester &&
          subject.batch === selectedBatch &&
          subject.section === selectedSection &&
          subject.academicYear === selectedAcademicYear
      )
      .forEach((subject) => removeSubject(subject.id));
  };

  const handleResetSubjects = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all subjects? This action cannot be undone."
      )
    ) {
      resetSubjects();
      setSavedSelections(null);
    }
  };

  const handleSaveAllSubjects = () => {
    saveSubjects();
    setSavedSelections({
      batch: selectedBatch,
      section: selectedSection,
      semester: selectedSemester,
      academicYear: selectedAcademicYear,
    });
    alert("All subjects have been saved successfully!");
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  const uniqueSubjects = subjects
    .filter(
      (subject) =>
        subject.semester === selectedSemester &&
        subject.batch === selectedBatch &&
        subject.section === selectedSection &&
        subject.academicYear === selectedAcademicYear
    )
    .reduce((acc, subject) => {
      const key = `${subject.code}-${subject.name}`;
      if (!acc.some((s) => `${s.code}-${s.name}` === key)) {
        acc.push({
          code: subject.code,
          name: subject.name,
          staffName: subject.staffName,
        });
      }
      return acc;
    }, [] as Array<{ code: string; name: string; staffName: string }>);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleResetSubjects}
              className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <RefreshCw size={20} />
              Reset All
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {savedSelections && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Last Saved Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Academic Year</p>
                  <p className="font-medium">{savedSelections.academicYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch</p>
                  <p className="font-medium">{savedSelections.batch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Section</p>
                  <p className="font-medium">
                    Section {savedSelections.section}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Semester</p>
                  <p className="font-medium">
                    Semester {savedSelections.semester}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sections.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleAddSubject} className="mb-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder="Enter subject code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => handleInputChange("staff", e.target.value)}
                  placeholder="Enter staff name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter subject name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showSave && staffName.trim() ? (
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={20} />
                    Add Subject
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 bg-gray-200 text-gray-400 px-6 py-2 rounded-lg cursor-not-allowed"
                  >
                    <PlusCircle size={20} />
                    Add Subject
                  </button>
                )}
              </div>
            </div>
          </form>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Subjects for {selectedBatch} - Section {selectedSection} -
                Semester {selectedSemester} - {selectedAcademicYear}
              </h2>
              {showSaveAll && (
                <button
                  onClick={handleSaveAllSubjects}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save size={20} />
                  Save All Subjects
                </button>
              )}
            </div>
            <div className="grid gap-4">
              {uniqueSubjects.map((subject) => (
                <div
                  key={`${subject.code}-${subject.name}`}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {subject.code}
                      </span>
                      <span>{subject.name}</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-600">
                        Staff: {subject.staffName}
                      </span>
                      <Check size={16} className="text-green-500" />
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(subject)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
