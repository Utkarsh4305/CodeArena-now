import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  List,
  Card,
  CardContent,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Paper,
  Grid,
  Button,
  Snackbar,
  Alert,
  Slider,
} from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


const FetchSubmissionsScreen = () => {
  const { workspaceId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marks, setMarks] = useState({});
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const chartRef = useRef(null);
  const contentRef = useRef(null);
  const username = localStorage.getItem("username") || "";

  // Format code with proper indentation
  const formatCode = (code) => {
    if (!code) return "";
    
    // Replace tabs with 4 spaces for consistent indentation
    let formatted = code.replace(/\t/g, '    ');
    
    // Split into lines and trim each line while preserving relative indentation
    const lines = formatted.split('\n');
    if (lines.length === 0) return "";
    
    // Find minimum indentation (to handle cases where the whole block is indented)
    const minIndent = lines.reduce((min, line) => {
      if (line.trim().length === 0) return min;
      const leadingSpaces = line.match(/^ */)[0].length;
      return Math.min(min, leadingSpaces);
    }, Infinity);
    
    // Remove common indentation from all lines
    formatted = lines.map(line => 
      line.length > minIndent ? line.substring(minIndent) : line
    ).join('\n');
    
    return formatted;
  };
  const CodeBlock = ({ code, language = 'python' }) => {
    return (
      <Paper sx={{
        p: 2,
        background: '#011627',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '400px',
        border: '1px solid rgba(156, 39, 176, 0.3)',
      }}>
        <pre style={{
          margin: 0,
          color: '#d6deeb',
          fontFamily: '"Fira Code", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          tabSize: 2,
        }}>
          <code>{code}</code>
        </pre>
      </Paper>
    );
  };
  
  // Fetch assignment details and submissions
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceDoc = await getDoc(workspaceRef);

        if (workspaceDoc.exists()) {
          const assignmentsList = workspaceDoc.data().assignments || [];
          const foundAssignment = assignmentsList.find(
            (assignment) => assignment.postedAt.toString() === assignmentId
          );

          if (foundAssignment) {
            setAssignment(foundAssignment);
            const submissionsList = foundAssignment.submissions || [];
            
            // Format all code answers in submissions
            const formattedSubmissions = submissionsList.map(submission => {
              const formattedAnswers = {};
              Object.entries(submission.answers || {}).forEach(([key, value]) => {
                formattedAnswers[key] = typeof value === 'string' ? formatCode(value) : value;
              });
              return {
                ...submission,
                answers: formattedAnswers
              };
            });
            
            setSubmissions(formattedSubmissions);
          } else {
            console.error("Assignment not found");
            navigate("/workspaces");
          }
        } else {
          console.error("Workspace not found");
          navigate("/workspaces");
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
        navigate("/workspaces");
      }
    };

    fetchAssignment();
  }, [workspaceId, assignmentId, navigate]);

  // Prevent horizontal scroll and handle resizing
  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current) {
        contentRef.current.style.width = `${window.innerWidth}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMarksChange = (question, value) => {
    setMarks((prevMarks) => ({
      ...prevMarks,
      [question]: value,
    }));
  };

  const saveMarks = async () => {
    try {
      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);

      if (workspaceDoc.exists()) {
        const assignmentsList = workspaceDoc.data().assignments || [];
        const updatedAssignments = assignmentsList.map((a) => {
          if (a.postedAt.toString() === assignmentId) {
            const updatedSubmissions = a.submissions.map((submission) => {
              if (submission.submittedBy === selectedSubmission.submittedBy) {
                return {
                  ...submission,
                  marks: marks,
                };
              }
              return submission;
            });

            return {
              ...a,
              submissions: updatedSubmissions,
            };
          }
          return a;
        });

        await updateDoc(workspaceRef, { assignments: updatedAssignments });
        
        setSubmissions(prevSubmissions => 
          prevSubmissions.map(submission => 
            submission.submittedBy === selectedSubmission.submittedBy
              ? { ...submission, marks }
              : submission
          )
        );
        
        setSnackbarMessage("Marks saved successfully!");
        setSnackbarOpen(true);
      } else {
        setError("Workspace not found.");
      }
    } catch (e) {
      setError(`Error saving marks: ${e.message}`);
      setSnackbarMessage(`Error saving marks: ${e.message}`);
      setSnackbarOpen(true);
    }
  };

  const saveQuestionMark = async (question, value) => {
    try {
      const updatedMarks = {
        ...marks,
        [question]: value,
      };
      setMarks(updatedMarks);
      
      if (!selectedSubmission) return;
      
      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);

      if (workspaceDoc.exists()) {
        const assignmentsList = workspaceDoc.data().assignments || [];
        const updatedAssignments = assignmentsList.map((a) => {
          if (a.postedAt.toString() === assignmentId) {
            const updatedSubmissions = a.submissions.map((submission) => {
              if (submission.submittedBy === selectedSubmission.submittedBy) {
                const submissionMarks = submission.marks || {};
                return {
                  ...submission,
                  marks: {
                    ...submissionMarks,
                    [question]: value,
                  }
                };
              }
              return submission;
            });

            return {
              ...a,
              submissions: updatedSubmissions,
            };
          }
          return a;
        });

        await updateDoc(workspaceRef, { assignments: updatedAssignments });
        
        setSubmissions(prevSubmissions => 
          prevSubmissions.map(submission => {
            if (submission.submittedBy === selectedSubmission.submittedBy) {
              const updatedMarks = {
                ...(submission.marks || {}),
                [question]: value,
              };
              return { ...submission, marks: updatedMarks };
            }
            return submission;
          })
        );
        
        setSnackbarMessage(`Mark for ${question} updated!`);
        setSnackbarOpen(true);
      }
    } catch (e) {
      setError(`Error saving mark: ${e.message}`);
      setSnackbarMessage(`Error saving mark: ${e.message}`);
      setSnackbarOpen(true);
    }
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Assignment Report: ${assignment.title || "Untitled Assignment"}`, 10, 10);

    doc.setFontSize(12);
    doc.text(`Average Score: ${performanceMetrics.averageScore}%`, 10, 20);
    doc.text(`Highest Score: ${performanceMetrics.highestScore}%`, 10, 30);
    doc.text(`Lowest Score: ${performanceMetrics.lowestScore}%`, 10, 40);

    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      const chartImage = canvas.toDataURL("image/png");

      doc.addImage(chartImage, "PNG", 10, 50, 180, 100);
    }

    doc.save(`assignment-report-${assignmentId}.pdf`);
  };

  const exportToCSV = () => {
    const csvContent =
      "Student Name,Submission Time," +
      assignment.questions.map((_, index) => `Q${index + 1} Mark`).join(",") +
      ",Total Marks\n" +
      submissions
        .map((submission) => {
          const marks = assignment.questions.map(
            (_, index) => submission.marks?.[`Q${index + 1}`] || "0"
          );
          const totalMarks = marks.reduce((sum, mark) => sum + (parseInt(mark) || 0), 0);

          const submissionTime = new Date(submission.submittedAt).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });

          return `${submission.submittedBy},"${submissionTime}",${marks.join(",")},${totalMarks}`;
        })
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `submissions-${assignmentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculatePerformanceMetrics = () => {
    if (submissions.length === 0) return null;

    const studentScores = submissions.map((submission) => {
      const totalQuestions = assignment.questions.length;
      const totalMarks = Object.values(submission.marks || {}).reduce(
        (sum, mark) => sum + (parseInt(mark) || 0), 
        0
      );
      const maxPossibleMarks = totalQuestions * 10;
      const score = maxPossibleMarks > 0 ? (totalMarks / maxPossibleMarks) * 100 : 0;
      
      return {
        name: submission.submittedBy || "Unknown",
        score: parseFloat(score.toFixed(2)),
      };
    });

    const totalScore = studentScores.reduce((sum, student) => sum + student.score, 0);
    const averageScore = totalScore / studentScores.length;
    const highestScore = Math.max(...studentScores.map((student) => student.score));
    const lowestScore = Math.min(...studentScores.map((student) => student.score));

    return {
      studentScores,
      averageScore: parseFloat(averageScore.toFixed(2)),
      highestScore: parseFloat(highestScore.toFixed(2)),
      lowestScore: parseFloat(lowestScore.toFixed(2)),
    };
  };

  const performanceMetrics = calculatePerformanceMetrics();

  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a0a18 0%, #12121e 100%)',
    }}>
      {/* Futuristic Holographic Background */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(45deg, 
              rgba(156, 39, 176, 0.03) 0%, 
              rgba(156, 39, 176, 0) 20%,
              rgba(100, 50, 200, 0.03) 40%,
              rgba(100, 50, 200, 0) 60%,
              rgba(156, 39, 176, 0.03) 80%,
              rgba(156, 39, 176, 0) 100%
            )`,
          backgroundSize: '200% 200%',
          animation: 'holographic 15s ease infinite',
          '@keyframes holographic': {
            '0%': { backgroundPosition: '0% 0%' },
            '50%': { backgroundPosition: '100% 100%' },
            '100%': { backgroundPosition: '0% 0%' }
          }
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(156, 39, 176, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 50, 200, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }
      }}>
        {/* Floating Tech Orbs */}
        {[...Array(8)].map((_, i) => {
          const size = 100 + Math.random() * 200;
          const duration = 20 + Math.random() * 20;
          const delay = Math.random() * 10;
          const color = i % 2 === 0 ? 'rgba(156, 39, 176, 0.1)' : 'rgba(100, 50, 200, 0.1)';
          
          return (
            <Box key={i} sx={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              filter: 'blur(20px)',
              animation: `float ${duration}s ease-in-out ${delay}s infinite`,
              '@keyframes float': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '25%': { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)` },
                '50%': { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)` },
                '75%': { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)` }
              }
            }} />
          );
        })}
        
        {/* Scanning Lines */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            rgba(156, 39, 176, 0.02) 50%,
            transparent 100%
          )`,
          backgroundSize: '100% 8px',
          animation: 'scan 4s linear infinite',
          '@keyframes scan': {
            '0%': { backgroundPosition: '0 0' },
            '100%': { backgroundPosition: '0 8px' }
          }
        }} />
      </Box>

      <AppBar position="static" sx={{ 
        background: 'rgba(18, 18, 35, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(156, 39, 176, 0.2)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 2,
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ 
            flexGrow: 1,
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '1px',
            color: '#e0e0e0',
            textShadow: '0 0 10px rgba(156, 39, 176, 0.5)'
          }}>
            Assignment Submissions
          </Typography>
        </Toolbar>
      </AppBar>

      <Container 
        ref={contentRef}
        sx={{ 
          position: 'absolute',
          top: '64px',
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 2,
          zIndex: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(18, 18, 35, 0.3)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(156, 39, 176, 0.5)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(156, 39, 176, 0.7)',
          }
        }}
      >
        {assignment && (
          <Box sx={{ 
            maxWidth: '100%',
            width: '100%',
            overflow: 'hidden',
            px: 2
          }}>
            <Box sx={{ 
              display: "flex", 
              justifyContent: "space-between", 
              mb: 4,
              alignItems: 'center',
            }}>
              <Typography variant="h4" sx={{ 
                color: '#e0e0e0',
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: '1px',
                textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
              }}>
                {assignment.title || "Untitled Assignment"}
              </Typography>
              <Box>
                <Tooltip title="Generate PDF Report">
                  <IconButton 
                    onClick={generatePDFReport} 
                    sx={{ 
                      color: '#bb5fce',
                      '&:hover': {
                        color: '#d683e8',
                        background: 'rgba(156, 39, 176, 0.1)',
                      }
                    }}
                  >
                    <PictureAsPdfIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export to CSV">
                  <IconButton 
                    onClick={exportToCSV}
                    sx={{ 
                      color: '#bb5fce',
                      '&:hover': {
                        color: '#d683e8',
                        background: 'rgba(156, 39, 176, 0.1)',
                      }
                    }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Paper sx={{ 
              mb: 4, 
              p: 3,
              background: 'rgba(18, 18, 35, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(156, 39, 176, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
              <Typography variant="h6" sx={{ 
                mb: 2,
                color: '#bb5fce',
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: '1px',
              }}>
                Questions:
              </Typography>
              <List sx={{ 
                '& .MuiListItem-root': {
                  borderLeft: '2px solid rgba(156, 39, 176, 0.3)',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderLeft: '2px solid rgba(156, 39, 176, 0.7)',
                    background: 'rgba(156, 39, 176, 0.05)',
                  }
                }
              }}>
                {assignment.questions.map((question, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`Q${index + 1}: ${question}`} 
                      primaryTypographyProps={{ 
                        sx: { 
                          color: '#e0e0e0',
                          fontFamily: "'Roboto', sans-serif",
                        } 
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Paper sx={{ 
              mb: 4, 
              p: 3,
              background: 'rgba(18, 18, 35, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(156, 39, 176, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
              <Typography variant="h6" sx={{ 
                mb: 2,
                color: '#bb5fce',
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: '1px',
              }}>
                Submissions
              </Typography>

              {submissions.length === 0 ? (
                <Typography variant="body1" sx={{ 
                  fontStyle: "italic",
                  color: 'rgba(224, 224, 224, 0.7)',
                }}>
                  No submissions yet.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {submissions.map((submission, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card
                        sx={{ 
                          cursor: "pointer",
                          transition: 'all 0.3s ease',
                          background: selectedSubmission?.submittedBy === submission.submittedBy 
                            ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.2) 0%, rgba(18, 18, 35, 0.6) 100%)'
                            : 'rgba(18, 18, 35, 0.6)',
                          border: selectedSubmission?.submittedBy === submission.submittedBy 
                            ? '1px solid rgba(156, 39, 176, 0.5)'
                            : '1px solid rgba(156, 39, 176, 0.15)',
                          boxShadow: selectedSubmission?.submittedBy === submission.submittedBy 
                            ? '0 0 20px rgba(156, 39, 176, 0.3)'
                            : '0 4px 20px rgba(0, 0, 0, 0.2)',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 0 20px rgba(156, 39, 176, 0.4)',
                          }
                        }}
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setMarks(submission.marks || {});
                        }}
                      >
                        <CardContent>
                          <Typography variant="body1" sx={{ 
                            color: '#e0e0e0',
                            fontWeight: 'bold',
                            mb: 1,
                          }}>
                            {submission.submittedBy || "Unknown"}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(224, 224, 224, 0.7)',
                            fontSize: '0.8rem',
                          }}>
                            {new Date(submission.submittedAt).toLocaleString()}
                          </Typography>
                          {submission.marks && (
                            <Typography variant="body2" sx={{ 
                              mt: 1,
                              color: '#bb5fce',
                              fontSize: '0.8rem',
                            }}>
                              Total: {Object.values(submission.marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0)}/{assignment.questions.length * 10}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>

            {selectedSubmission && (
              <Paper sx={{ 
                mt: 4, 
                p: 3,
                background: 'rgba(18, 18, 35, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(156, 39, 176, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}>
                <Typography variant="h6" sx={{ 
                  mb: 3,
                  color: '#bb5fce',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '1px',
                }}>
                  Grading: {selectedSubmission.submittedBy || "Unknown"}
                </Typography>
                
                {Object.entries(selectedSubmission.answers || {}).map(([question, answer], index) => {
                  const questionNumber = question;
                  const currentMark = marks[questionNumber] !== undefined ? marks[questionNumber] : 0;
                  
                  return (
                    <Paper key={index} sx={{ 
                      mt: 2, 
                      p: 2, 
                      background: 'rgba(25, 25, 45, 0.4)',
                      border: '1px solid rgba(156, 39, 176, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '4px',
                        height: '100%',
                        background: 'linear-gradient(to bottom, rgba(156, 39, 176, 0.8), rgba(100, 50, 200, 0.8))',
                      }
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 'bold',
                        color: '#e0e0e0',
                        mb: 1,
                      }}>
                        {questionNumber}: {assignment.questions[parseInt(questionNumber.substring(1)) - 1]}
                      </Typography>
                      
                      {/* Code Display Section */}
                      <Paper sx={{
                        mt: 2,
                        mb: 3,
                        p: 2,
                        background: '#011627',
                        borderRadius: '4px',
                        overflow: 'auto',
                        maxHeight: '400px',
                        border: '1px solid rgba(156, 39, 176, 0.3)',
                      }}>
                        {typeof answer === 'string' ? (
                          <CodeBlock code={answer} />
                      ) : (
                        <Typography variant="body2" sx={{ 
                          color: 'rgba(224, 224, 224, 0.8)',
                          whiteSpace: 'pre-wrap',
                          fontFamily: '"Fira Code", monospace',
                        }}>
                          {JSON.stringify(answer, null, 2)}
                        </Typography>
                      )}
                      </Paper>
                      
                      <Box sx={{ px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography id={`mark-${questionNumber}`} sx={{ 
                            mr: 2, 
                            minWidth: '80px',
                            color: '#e0e0e0',
                          }}>
                            Mark: {currentMark}/10
                          </Typography>
                          <Slider
                            value={parseInt(currentMark) || 0}
                            onChange={(e, newValue) => handleMarksChange(questionNumber, newValue)}
                            onChangeCommitted={(e, newValue) => saveQuestionMark(questionNumber, newValue)}
                            aria-labelledby={`mark-${questionNumber}`}
                            valueLabelDisplay="auto"
                            step={1}
                            marks
                            min={0}
                            max={10}
                            sx={{ 
                              flex: 1,
                              color: '#9c27b0',
                              '& .MuiSlider-thumb': {
                                '&:hover, &.Mui-focusVisible': {
                                  boxShadow: '0 0 0 8px rgba(156, 39, 176, 0.16)',
                                },
                                '&.Mui-active': {
                                  boxShadow: '0 0 0 14px rgba(156, 39, 176, 0.16)',
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
                
                <Button 
                  variant="contained" 
                  onClick={saveMarks} 
                  sx={{ 
                    mt: 3,
                    background: 'linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)',
                    "&:hover": { 
                      background: '#7B1FA2',
                      boxShadow: '0 0 20px rgba(156, 39, 176, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    height: "44px",
                    borderRadius: "22px",
                    textTransform: "none",
                    fontWeight: "bold",
                    fontSize: '1rem',
                    letterSpacing: '0.5px',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset',
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  Save All Marks
                </Button>
              </Paper>
            )}

            {performanceMetrics && (
              <Paper sx={{ 
                mt: 4, 
                p: 3,
                background: 'rgba(18, 18, 35, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(156, 39, 176, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}>
                <Typography variant="h6" sx={{ 
                  mb: 3,
                  color: '#bb5fce',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '1px',
                }}>
                  Performance Analytics
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(25, 25, 45, 0.4)',
                      border: '1px solid rgba(156, 39, 176, 0.1)',
                    }}>
                      <Typography variant="body1" sx={{ color: 'rgba(224, 224, 224, 0.7)' }}>
                        Average Score
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: '#e0e0e0',
                        fontWeight: 'bold',
                        mt: 1,
                      }}>
                        {performanceMetrics.averageScore}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(25, 25, 45, 0.4)',
                      border: '1px solid rgba(156, 39, 176, 0.1)',
                    }}>
                      <Typography variant="body1" sx={{ color: 'rgba(224, 224, 224, 0.7)' }}>
                        Highest Score
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: '#e0e0e0',
                        fontWeight: 'bold',
                        mt: 1,
                      }}>
                        {performanceMetrics.highestScore}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ 
                      p: 2,
                      textAlign: 'center',
                      background: 'rgba(25, 25, 45, 0.4)',
                      border: '1px solid rgba(156, 39, 176, 0.1)',
                    }}>
                      <Typography variant="body1" sx={{ color: 'rgba(224, 224, 224, 0.7)' }}>
                        Lowest Score
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: '#e0e0e0',
                        fontWeight: 'bold',
                        mt: 1,
                      }}>
                        {performanceMetrics.lowestScore}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Box sx={{ 
                  height: "400px",
                  background: 'rgba(25, 25, 45, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid rgba(156, 39, 176, 0.1)',
                  p: 2,
                }} ref={chartRef}>
                  <Typography variant="h6" sx={{ 
                    mb: 2,
                    color: '#e0e0e0',
                    textAlign: 'center',
                  }}>
                    Student Performance Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={performanceMetrics.studentScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(224, 224, 224, 0.1)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#e0e0e0' }}
                        stroke="rgba(224, 224, 224, 0.5)"
                      />
                      <YAxis 
                        tick={{ fill: '#e0e0e0' }}
                        stroke="rgba(224, 224, 224, 0.5)"
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          background: 'rgba(18, 18, 35, 0.9)',
                          border: '1px solid rgba(156, 39, 176, 0.3)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="score" 
                        fill="#9c27b0"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={error ? "error" : "success"}
          sx={{
            background: error ? 'rgba(50, 10, 10, 0.9)' : 'rgba(10, 50, 10, 0.9)',
            color: error ? '#ff8f8f' : '#a0ffa0',
            border: error ? '1px solid rgba(255, 70, 70, 0.3)' : '1px solid rgba(70, 255, 70, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FetchSubmissionsScreen;