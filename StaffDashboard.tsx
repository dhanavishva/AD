import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Upload, BookOpen, LogOut, AlertCircle, Plus, Trash2, HelpCircle, Download, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { QuestionMark } from '../types';

const StaffDashboard = () => {
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedBatch, setSelectedBatch] = useState('2022-2026');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<1 | 2>(1);
  const [questionMarks, setQuestionMarks] = useState<QuestionMark[]>([]);
  const [partBQuestions, setPartBQuestions] = useState<QuestionMark[]>([]);
  const [showColumns, setShowColumns] = useState(false);
  const [showQuestionParts, setShowQuestionParts] = useState(false);
  const [selectedPart, setSelectedPart] = useState<'A' | 'B' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fixedPartAQuestions] = useState([
    { questionNumber: '1', co: 1, maxMarks: 2 },
    { questionNumber: '2', co: 1, maxMarks: 2 },
    { questionNumber: '3', co: 1, maxMarks: 2 },
    { questionNumber: '4', co: 1, maxMarks: 2 },
    { questionNumber: '5', co: 1, maxMarks: 2 },
    { questionNumber: '6', co: 1, maxMarks: 2 },
    { questionNumber: '7', co: 1, maxMarks: 2 },
    { questionNumber: '8', co: 1, maxMarks: 2 },
    { questionNumber: '9', co: 1, maxMarks: 2 },
    { questionNumber: '10', co: 1, maxMarks: 2 },
  ]);

  const subjects = useStore(state => state.subjects);
  const subjectsPublished = useStore(state => state.subjectsPublished);
  const addSerialTest = useStore(state => state.addSerialTest);
  const removeSerialTest = useStore(state => state.removeSerialTest);
  const serialTests = useStore(state => state.serialTests);
  const setUser = useStore(state => state.setUser);
  const setBatchAndSection = useStore(state => state.setBatchAndSection);
  const getSubjectsBySemester = useStore(state => state.getSubjectsBySemester);
  const navigate = useNavigate();

  // Reset everything when batch or semester changes
  useEffect(() => {
    setSelectedSubject('');
    setSelectedTest(1);
    setShowQuestionParts(false);
    setSelectedPart(null);
    setPartBQuestions([]);
    setQuestionMarks([]);
    setShowColumns(false);
  }, [selectedBatch, selectedSemester]);

  // Reset test-related states when subject changes
  useEffect(() => {
    setSelectedTest(1);
    setShowQuestionParts(false);
    setSelectedPart(null);
    setPartBQuestions([]);
    setQuestionMarks([]);
    setShowColumns(false);
  }, [selectedSubject]);

  // Load existing test data when test changes
  useEffect(() => {
    setShowQuestionParts(false);
    setSelectedPart(null);
    setPartBQuestions([]);
    setQuestionMarks([]);
    setShowColumns(false);

    const existingTest = serialTests.find(t =>
      t.subjectId === selectedSubject &&
      t.serialTestNumber === selectedTest &&
      t.batch === selectedBatch &&
      t.section === selectedSection
    );

    if (existingTest) {
      const partBQs = existingTest.questionMarks.slice(10);
      setPartBQuestions(partBQs);
    }
  }, [selectedTest, serialTests, selectedSubject, selectedBatch, selectedSection]);

  useEffect(() => {
    setBatchAndSection(selectedBatch, selectedSection);
  }, [selectedBatch, selectedSection, setBatchAndSection]);

  const currentYear = new Date().getFullYear();
  const batches = Array.from({ length: 10 }, (_, i) => `${currentYear - i}-${currentYear - i + 4}`);
  const sections = ['A', 'B', 'C'];

  const semesterSubjects = React.useMemo(() => {
    return getSubjectsBySemester(selectedSemester, selectedBatch, selectedSection);
  }, [getSubjectsBySemester, selectedSemester, selectedBatch, selectedSection]);

  const currentTest = React.useMemo(() => {
    if (!selectedSubject) return null;

    return serialTests.find(t =>
      t.subjectId === selectedSubject &&
      t.serialTestNumber === selectedTest &&
      t.batch === selectedBatch &&
      t.section === selectedSection
    );
  }, [serialTests, selectedSubject, selectedTest, selectedBatch, selectedSection]);

  const handleQuestionClick = () => {
    setShowQuestionParts(true);
    setSelectedPart(null);
    setShowColumns(false);
  };

  const handlePartAClick = () => {
    setSelectedPart('A');
    setShowColumns(true);
    setQuestionMarks(fixedPartAQuestions);
  };

  const handlePartBClick = () => {
    setSelectedPart('B');
    setShowColumns(true);
    setQuestionMarks(partBQuestions);
  };

  const addQuestion = () => {
    const newQuestion = {
      questionNumber: '',
      co: 1,
      maxMarks: '' as any
    };
    setShowColumns(true);
    const updatedQuestions = [...questionMarks, newQuestion];
    setQuestionMarks(updatedQuestions);
    setPartBQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questionMarks.filter((_, i) => i !== index);
    setQuestionMarks(updatedQuestions);
    setPartBQuestions(updatedQuestions);
    if (updatedQuestions.length === 0) {
      setShowColumns(false);
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionMark, value: string | number) => {
    const newQuestionMarks = [...questionMarks];
    newQuestionMarks[index] = {
      ...newQuestionMarks[index],
      [field]: value
    };
    setQuestionMarks(newQuestionMarks);
    if (selectedPart === 'B') {
      setPartBQuestions(newQuestionMarks);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        if (typeof bstr === 'string') {
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws) as Array<{
            'Register Number': string;
            'Name': string;
          }>;

          if (currentTest) {
            removeSerialTest(currentTest.id);
          }

          const studentMarks = data.map(row => ({
            rollNumber: Number(row['Register Number']),
            name: row['Name'],
            marks: Array(5).fill(0),
            questionMarks: {},
            submitted: false
          }));

          const allQuestions = [...fixedPartAQuestions];
          if (partBQuestions.length > 0) {
            allQuestions.push(...partBQuestions);
          }

          const newTest = {
            id: Date.now(),
            subjectId: selectedSubject,
            serialTestNumber: selectedTest,
            questionMarks: allQuestions,
            coMarks: Array(5).fill(0).map((_, index) => ({
              co: index + 1,
              maxMarks: 0
            })),
            studentMarks,
            batch: selectedBatch,
            section: selectedSection
          };

          addSerialTest(newTest);
        }
      };
      reader.readAsBinaryString(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleExport = () => {
    if (currentTest) {
      const selectedSubjectDetails = semesterSubjects.find(s => s.id === selectedSubject);

      if (selectedSubjectDetails) {
        const headerRows = [
          ['Subject Code:', selectedSubjectDetails.code],
          ['Subject Name:', selectedSubjectDetails.name],
          ['Serial Test:', selectedTest],
          ['Batch:', selectedBatch],
          ['Section:', selectedSection],
          [''],
        ];

        const validCOs = currentTest.questionMarks.reduce((acc, q) => {
          const coMarks = acc.find(co => co.co === q.co);
          if (coMarks) {
            coMarks.maxMarks += q.maxMarks;
          } else {
            acc.push({ co: q.co, maxMarks: q.maxMarks });
          }
          return acc;
        }, [] as Array<{ co: number; maxMarks: number }>);

        const studentData = currentTest.studentMarks.map(student => {
          const baseData = {
            'Register Number': student.rollNumber,
            'Name': student.name,
            'Submitted': student.submitted ? 'Yes' : 'No',
          };

          const questionData = currentTest.questionMarks.reduce((acc, q) => ({
            ...acc,
            [`Q${q.questionNumber} (Max: ${q.maxMarks})`]: student.questionMarks?.[q.questionNumber] || 0
          }), {});

          const totalMarks = student.marks.reduce((sum, mark) => sum + mark, 0);

          return {
            ...baseData,
            ...questionData,
            'Total Marks': totalMarks
          };
        });

        const ws = XLSX.utils.aoa_to_sheet(headerRows);
        XLSX.utils.sheet_add_json(ws, studentData, { origin: 'A8' });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks');

        const fileName = `${selectedSubjectDetails.code}_ST${selectedTest}_${selectedBatch}_${selectedSection}_marks.xlsx`;
        XLSX.writeFile(wb, fileName);
      }
    }
  };

  const handleSaveToDatabase = async () => {
    if (currentTest) {
      try {
        // Add your database save logic here
        console.log('Saving test data to database:', currentTest);
        // Example: await saveTestToDatabase(currentTest);
      } catch (error) {
        console.error('Error saving to database:', error);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Staff Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
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
              <div className="grid grid-cols-3 gap-6">
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

              {selectedSubject && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Serial Test
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedTest(1)}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors ${selectedTest === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        Serial Test 1
                      </button>
                      <button
                        onClick={() => setSelectedTest(2)}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors ${selectedTest === 2
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        Serial Test 2
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Question-CO Mapping</h3>
                      <button
                        onClick={handleQuestionClick}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <HelpCircle size={20} />
                        Question
                      </button>
                    </div>

                    {showQuestionParts && (
                      <div className="flex gap-4 justify-center my-4">
                        <button
                          onClick={handlePartAClick}
                          className={`px-6 py-3 rounded-lg transition-colors ${selectedPart === 'A'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          Part A
                        </button>
                        <button
                          onClick={handlePartBClick}
                          className={`px-6 py-3 rounded-lg transition-colors ${selectedPart === 'B'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          Part B
                        </button>
                      </div>
                    )}

                    {selectedPart && (
                      <div className="space-y-4">
                        {selectedPart === 'B' && (
                          <div className="flex justify-end">
                            <button
                              onClick={addQuestion}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Plus size={20} />
                              Add Question
                            </button>
                          </div>
                        )}

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Question Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  CO Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Max Marks
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {questionMarks.map((q, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                      type="text"
                                      value={q.questionNumber}
                                      onChange={(e) => updateQuestion(index, 'questionNumber', e.target.value)}
                                      placeholder="e.g.11(a)(i)"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      disabled={selectedPart === 'A'}
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                      value={q.co}
                                      onChange={(e) => updateQuestion(index, 'co', Number(e.target.value))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>CO {i + 1}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                      type="number"
                                      value={q.maxMarks}
                                      onChange={(e) => updateQuestion(index, 'maxMarks', Number(e.target.value))}
                                      min="0"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      disabled={selectedPart === 'A'}
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {selectedPart === 'B' && (
                                      <button
                                        onClick={() => removeQuestion(index)}
                                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                      >
                                        <Trash2 size={20} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />

                    <h2 className="text-1xl font-bold text-gray-500 text-center my-4">
                      The uploaded Excel sheet contains Register Number and Name
                    </h2>

                    <div className="flex gap-4">
                      <button
                        onClick={handleUploadClick}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Upload size={20} />
                        Upload Name List
                      </button>

                      {currentTest && (
                        <>
                          <button
                            onClick={handleExport}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download size={20} />
                            Export Mark Sheet
                          </button>

                          <button
                            onClick={handleSaveToDatabase}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Save size={20} />
                            Save to Database
                          </button>
                        </>
                      )}
                    </div>

                    {currentTest && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Student Marks Status</h3>
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="space-y-4">
                            {currentTest.studentMarks.map((student, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                                <div>
                                  <h4 className="font-medium">{student.name}</h4>
                                  <p className="text-sm text-gray-600">Register Number: {student.rollNumber}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`px-3 py-1 rounded-full text-sm ${student.submitted
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {student.submitted ? 'Submitted' : 'Pending'}
                                  </span>
                                  {student.submitted && (
                                    <div className="flex gap-2">
                                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded font-medium">
                                        Total: {student.marks.reduce((a, b) => a + b, 0)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;