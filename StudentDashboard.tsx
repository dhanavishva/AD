import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { BookOpen, ClipboardList, LogOut, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedBatch, setSelectedBatch] = useState('2022-2026');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2023-2024');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<1 | 2>(1);
  const [rollNumber, setRollNumber] = useState('');
  const [questionMarks, setQuestionMarks] = useState<{ [key: string]: number }>({});
  const [exceedMarks, setExceedMarks] = useState<{ [key: string]: boolean }>({});

  const subjects = useStore(state => state.subjects);
  const subjectsPublished = useStore(state => state.subjectsPublished);
  const serialTests = useStore(state => state.serialTests);
  const updateStudentMarks = useStore(state => state.updateStudentMarks);
  const setUser = useStore(state => state.setUser);
  const setBatchAndSection = useStore(state => state.setBatchAndSection);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedSubject('');
    setSelectedTest(1);
    setQuestionMarks({});
    setExceedMarks({});
    setRollNumber('');
  }, [selectedBatch, selectedSemester, selectedAcademicYear]);

  useEffect(() => {
    setSelectedTest(1);
    setQuestionMarks({});
    setExceedMarks({});
  }, [selectedSubject]);

  useEffect(() => {
    setQuestionMarks({});
    setExceedMarks({});
  }, [selectedTest]);

  useEffect(() => {
    setRollNumber('');
  }, [selectedSection]);

  useEffect(() => {
    setBatchAndSection(selectedBatch, selectedSection);
  }, [selectedBatch, selectedSection, setBatchAndSection]);

  const currentYear = new Date().getFullYear();
  const batches = Array.from({ length: 10 }, (_, i) => `${currentYear - i}-${currentYear - i + 4}`);
  const academicYears = Array.from({ length: 10 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`);
  const sections = ['A', 'B', 'C'];

  const semesterSubjects = useMemo(() => {
    const uniqueSubjects = subjects
      .filter(s => 
        s.semester === selectedSemester && 
        s.batch === selectedBatch &&
        s.academicYear === selectedAcademicYear
      )
      .reduce((acc, subject) => {
        const key = `${subject.code}-${subject.name}`;
        if (!acc.some(s => `${s.code}-${s.name}` === key)) {
          acc.push(subject);
        }
        return acc;
      }, [] as typeof subjects);

    return uniqueSubjects;
  }, [subjects, selectedSemester, selectedBatch, selectedAcademicYear]);

  const selectedSubjectDetails = useMemo(() => {
    return subjects.find(s => s.id === selectedSubject);
  }, [subjects, selectedSubject]);

  const currentTest = useMemo(() => {
    if (!selectedSubject || !rollNumber) return null;

    return serialTests.find(t =>
      t.subjectId === selectedSubject &&
      t.serialTestNumber === selectedTest &&
      t.batch === selectedBatch &&
      t.section === selectedSection
    );
  }, [serialTests, selectedSubject, selectedTest, selectedBatch, selectedSection, rollNumber]);

  const currentStudent = currentTest?.studentMarks.find(s => s.rollNumber === Number(rollNumber));

  const handleMarkChange = (questionNumber: string, value: string, maxMarks: number) => {
    const numValue = Math.max(0, Number(value));
    const newQuestionMarks = { ...questionMarks };
    const newExceedMarks = { ...exceedMarks };

    if (value === '') {
      delete newQuestionMarks[questionNumber];
      delete newExceedMarks[questionNumber];
    } else {
      newQuestionMarks[questionNumber] = numValue;
      newExceedMarks[questionNumber] = numValue > maxMarks;
    }

    setQuestionMarks(newQuestionMarks);
    setExceedMarks(newExceedMarks);
  };

  const isSubmitDisabled = useMemo(() => {
    if (!rollNumber || !currentTest?.questionMarks.length) return true;

    const hasAnyMarks = Object.keys(questionMarks).length > 0;
    const hasExceededMarks = Object.values(exceedMarks).some(exceed => exceed);
    const hasInvalidMarks = Object.values(questionMarks).some(mark => mark < 0);

    return !hasAnyMarks || hasExceededMarks || hasInvalidMarks;
  }, [rollNumber, currentTest?.questionMarks.length, questionMarks, exceedMarks]);

  const handleSubmitMarks = () => {
    if (currentTest) {
      const coMarks = new Array(5).fill(0);
      currentTest.questionMarks.forEach(question => {
        const mark = questionMarks[question.questionNumber] || 0;
        if (question.co >= 1 && question.co <= 5) {
          coMarks[question.co - 1] += mark;
        }
      });

      updateStudentMarks(currentTest.id, Number(rollNumber), coMarks, questionMarks);
      setQuestionMarks({});
      setExceedMarks({});
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const getTotalMarks = () => {
    return Object.values(questionMarks).reduce((sum, mark) => sum + mark, 0);
  };

  return (
    <div className="min-h-screen p-8 ">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!subjectsPublished ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Subjects Not Available Yet
              </h2>
              <p className="text-gray-600">
                Please wait for the admin to publish the subjects list.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    {batches.map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
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
                    {sections.map(section => (
                      <option key={section} value={section}>Section {section}</option>
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
                      <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Register Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Enter your Register Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a subject</option>
                  {semesterSubjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubjectDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-medium">Staff Name</p>
                      <p className="text-gray-600">{selectedSubjectDetails.staffName}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSubject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Serial Test
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedTest(1)}
                      className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                        selectedTest === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Serial Test 1
                    </button>
                    <button
                      onClick={() => setSelectedTest(2)}
                      className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                        selectedTest === 2
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Serial Test 2
                    </button>
                  </div>
                </div>
              )}

              {currentTest && currentStudent && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Your Information</h3>
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <p className="text-lg font-medium">{currentStudent.name}</p>
                    <p className="text-gray-600">Register Number: {currentStudent.rollNumber}</p>
                    {currentStudent.submitted && (
                      <div className="mt-4">
                        <p className="text-green-600 font-medium">
                          Marks Successfully submitted - Total: {currentStudent.marks.reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                    )}
                  </div>

                  {!currentStudent.submitted && currentTest.questionMarks.length > 0 && (
                    <>
                      <h3 className="text-xl font-semibold mb-4">Enter Your Marks</h3>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="space-y-4">
                          <h4 className="text-xl font-bold text-gray-800 mb-3">Enter Marks for Part A</h4>
                          {currentTest.questionMarks.slice(0, 10).map((q) => (
                            <div key={q.questionNumber} className="flex items-center gap-4">
                              <span className="text-gray-600 min-w-[120px]">Question {q.questionNumber}:</span>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  max={q.maxMarks}
                                  value={questionMarks[q.questionNumber] || ''}
                                  onChange={(e) => handleMarkChange(q.questionNumber, e.target.value, q.maxMarks)}
                                  onBlur={(e) => {
                                    if (e.target.value !== '' && Number(e.target.value) < 0) {
                                      handleMarkChange(q.questionNumber, '0', q.maxMarks);
                                    }
                                  }}
                                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    exceedMarks[q.questionNumber] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                  }`}
                                />
                                {exceedMarks[q.questionNumber] && (
                                  <span className="absolute top-[-10px] right-2 text-red-500 text-xs bg-white px-1 rounded">
                                    Max: {q.maxMarks}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}

                          {currentTest.questionMarks.length > 10 && (
                            <>
                              <h4 className="text-xl font-bold text-gray-800 mt-6 mb-3">Enter Marks for Part B</h4>
                              {currentTest.questionMarks.slice(10).map((q) => (
                                <div key={q.questionNumber} className="flex items-center gap-4">
                                  <span className="text-gray-600 min-w-[120px]">Question {q.questionNumber}:</span>
                                  <div className="flex-1 relative">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      max={q.maxMarks}
                                      value={questionMarks[q.questionNumber] || ''}
                                      onChange={(e) => handleMarkChange(q.questionNumber, e.target.value, q.maxMarks)}
                                      onBlur={(e) => {
                                        if (e.target.value !== '' && Number(e.target.value) < 0) {
                                          handleMarkChange(q.questionNumber, '0', q.maxMarks);
                                        }
                                      }}
                                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        exceedMarks[q.questionNumber] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                      }`}
                                    />
                                    {exceedMarks[q.questionNumber] && (
                                      <span className="absolute top-[-10px] right-2 text-red-500 text-xs bg-white px-1 rounded">
                                        Max: {q.maxMarks}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <p className="text-lg font-semibold text-blue-800">
                              Total Marks: {getTotalMarks()}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleSubmitMarks}
                          disabled={isSubmitDisabled}
                          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <ClipboardList size={20} />
                          Submit Marks
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;