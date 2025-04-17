import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  TextField,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
} from "@mui/material";
import { Download, ArrowBack, PictureAsPdf } from "@mui/icons-material";
import { format } from "date-fns";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { CSVLink } from "react-csv";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

const ExportWorkspaceDataScreen = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [studentCsvData, setStudentCsvData] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const csvLinkRef = useRef(null);
  const studentCsvLinkRef = useRef(null);
  const username = localStorage.getItem("username") || "";
  const isTeacher = username === "teacher";

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        const workspacesList = [];
        
        const creatorQuery = query(
          collection(db, "workspaces"),
          where("creator", "==", username)
        );
        const creatorDocs = await getDocs(creatorQuery);
        creatorDocs.forEach((doc) =>
          workspacesList.push({ id: doc.id, ...doc.data() })
        );

        if (isTeacher) {
          const teacherQuery = query(
            collection(db, "workspaces"),
            where("teachers", "array-contains", username)
          );
          const teacherDocs = await getDocs(teacherQuery);
          teacherDocs.forEach((doc) => {
            if (!workspacesList.some(ws => ws.id === doc.id)) {
              workspacesList.push({ id: doc.id, ...doc.data() });
            }
          });
        }

        setWorkspaces(workspacesList);
      } catch (err) {
        setError("Failed to fetch workspaces");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchWorkspaces();
  }, [username, isTeacher]);

  const safeFormatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    
    try {
      let dateObj;
      
      if (typeof dateValue === 'object' && dateValue.seconds) {
        dateObj = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === 'number') {
        dateObj = new Date(dateValue);
      } else {
        dateObj = new Date(dateValue);
      }
      
      if (isNaN(dateObj.getTime())) return "N/A";
      
      return format(dateObj, "PPpp");
    } catch (err) {
      console.error("Date formatting error:", err);
      return "N/A";
    }
  };

  const handleWorkspaceSelect = async (workspace) => {
    setSelectedWorkspace(workspace);
    setAssignments(workspace.assignments || []);
    prepareCSVData(workspace.assignments || []);
    await prepareStudentMarksCSV(workspace);
  };

  const prepareCSVData = useCallback((assignmentsData) => {
    if (!assignmentsData.length) return [];

    const data = assignmentsData.map((assignment) => ({
      title: assignment.title || "Untitled",
      description: assignment.description || "No description",
      postedDate: safeFormatDate(assignment.postedAt),
      activationDate: safeFormatDate(assignment.activationDate),
      closingDate: safeFormatDate(assignment.closingDate),
      status: getAssignmentStatus(assignment).label,
      questionsCount: assignment.questions ? assignment.questions.length : 0,
      submissionsCount: assignment.submissions
        ? assignment.submissions.length
        : 0,
    }));

    setCsvData(data);
    return data;
  }, []);

  const prepareStudentMarksCSV = async (workspace) => {
    try {
      setLoading(true);
      
      if (!workspace.assignments) {
        setStudentCsvData([]);
        return;
      }
      
      const studentsData = [];
      
      workspace.assignments.forEach(assignment => {
        if (assignment.submissions && assignment.submissions.length > 0) {
          assignment.submissions.forEach(submission => {
            const studentName = submission.submittedBy || submission.studentName || "Unknown Student";
            
            let totalMark = 'Not graded';
            let feedback = '';
            
            if (submission.marks) {
              totalMark = Object.values(submission.marks).reduce((sum, mark) => sum + parseFloat(mark || 0), 0);
            }
            
            if (submission.evaluations) {
              const evaluationEntries = Object.entries(submission.evaluations);
              if (evaluationEntries.length > 0) {
                feedback = evaluationEntries.map(([question, evaluation]) => {
                  return `${question}: ${evaluation.review || 'No review'} (Grade: ${evaluation.grade || 'N/A'})`;
                }).join(' | ');
              }
            }
            
            let answers = '';
            if (submission.answers) {
              answers = Object.entries(submission.answers)
                .map(([question, answer]) => `${question}: ${answer}`)
                .join(' | ');
            }
            
            const rowData = {
              "Student Name": studentName,
              "Assignment Title": assignment.title || "Untitled Assignment",
              "Mark": totalMark,
              "Submission Date": safeFormatDate(submission.submittedAt),
              "Answers": answers,
              "Feedback": feedback,
              "Assignment Posted": safeFormatDate(assignment.postedAt),
              "Assignment Due": safeFormatDate(assignment.closingDate)
            };
            
            studentsData.push(rowData);
          });
        }
      });
      
      setStudentCsvData(studentsData);
      
    } catch (err) {
      console.error("Error preparing student marks CSV:", err);
      setError("Failed to prepare student marks data");
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatus = (assignment) => {
    const currentTime = new Date().getTime();
    let activationTime, closingTime;
    
    try {
      if (assignment.activationDate && typeof assignment.activationDate === 'object' && assignment.activationDate.seconds) {
        activationTime = assignment.activationDate.seconds * 1000;
      } else if (typeof assignment.activationDate === 'number') {
        activationTime = assignment.activationDate;
      } else {
        activationTime = assignment.activationDate ? new Date(assignment.activationDate).getTime() : 0;
      }
      
      if (assignment.closingDate && typeof assignment.closingDate === 'object' && assignment.closingDate.seconds) {
        closingTime = assignment.closingDate.seconds * 1000;
      } else if (typeof assignment.closingDate === 'number') {
        closingTime = assignment.closingDate;
      } else {
        closingTime = assignment.closingDate ? new Date(assignment.closingDate).getTime() : Infinity;
      }
      
      if (isNaN(activationTime)) activationTime = 0;
      if (isNaN(closingTime)) closingTime = Infinity;
      
    } catch (err) {
      console.error("Error processing assignment dates:", err);
      activationTime = 0;
      closingTime = Infinity;
    }

    if (currentTime < activationTime) {
      return { label: "Upcoming", color: "#ff9800" };
    } else if (currentTime > closingTime) {
      return { label: "Closed", color: "#f44336" };
    } else {
      return { label: "Active", color: "#4caf50" };
    }
  };

  const exportAssignmentQuestionsPDF = (assignment) => {
    try {
      const doc = new jsPDF();
      
      const title = assignment.title || "Untitled Assignment";
      doc.setFontSize(20);
      doc.text(title, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Posted: ${safeFormatDate(assignment.postedAt)}`, 20, 30);
      doc.text(`Due: ${safeFormatDate(assignment.closingDate)}`, 20, 40);
      
      if (assignment.description) {
        doc.text("Description:", 20, 50);
        const splitDescription = doc.splitTextToSize(assignment.description, 170);
        doc.text(splitDescription, 20, 60);
      }
      
      let yPosition = assignment.description ? 80 : 50;
      if (assignment.questions && assignment.questions.length > 0) {
        doc.text("Questions:", 20, yPosition);
        yPosition += 10;
        
        assignment.questions.forEach((question, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          const questionText = `${index + 1}. ${question}`;
          const splitQuestion = doc.splitTextToSize(questionText, 170);
          doc.text(splitQuestion, 20, yPosition);
          yPosition += 10 * splitQuestion.length + 5;
        });
      } else {
        doc.text("No questions are available for this assignment.", 20, yPosition);
      }
      
      doc.save(`${title}_questions.pdf`);
      
      setSnackbar({
        open: true,
        message: "Questions exported as PDF successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      setSnackbar({
        open: true,
        message: "Error generating PDF. Please try again.",
        severity: "error",
      });
    }
  };

  const exportAllAssignmentsPDF = () => {
    try {
      if (!assignments || assignments.length === 0) {
        setSnackbar({
          open: true,
          message: "No assignments to export",
          severity: "warning",
        });
        return;
      }
      
      const doc = new jsPDF();
      const workspaceTitle = selectedWorkspace.title || "Untitled Workspace";
      
      doc.setFontSize(22);
      doc.text(workspaceTitle, 20, 20);
      
      let currentPage = 1;
      let yPosition = 40;
      
      assignments.forEach((assignment, assignmentIndex) => {
        if (yPosition > 240 && assignmentIndex > 0) {
          doc.addPage();
          currentPage++;
          yPosition = 20;
        }
        
        doc.setFontSize(16);
        doc.text(`Assignment ${assignmentIndex + 1}: ${assignment.title || "Untitled"}`, 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.text(`Posted: ${safeFormatDate(assignment.postedAt)}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Due: ${safeFormatDate(assignment.closingDate)}`, 20, yPosition);
        yPosition += 15;
        
        if (assignment.description) {
          doc.text("Description:", 20, yPosition);
          yPosition += 8;
          const splitDescription = doc.splitTextToSize(assignment.description.slice(0, 300) + (assignment.description.length > 300 ? "..." : ""), 170);
          doc.text(splitDescription, 20, yPosition);
          yPosition += splitDescription.length * 7 + 10;
        }
        
        if (assignment.questions && assignment.questions.length > 0) {
          doc.text("Questions:", 20, yPosition);
          yPosition += 8;
          
          assignment.questions.forEach((question, index) => {
            if (yPosition > 270) {
              doc.addPage();
              currentPage++;
              yPosition = 20;
            }
            
            const questionText = `${index + 1}. ${question}`;
            const splitQuestion = doc.splitTextToSize(questionText, 170);
            doc.text(splitQuestion, 20, yPosition);
            yPosition += splitQuestion.length * 7 + 5;
          });
        } else {
          doc.text("No questions available", 20, yPosition);
          yPosition += 8;
        }
        
        yPosition += 20;
      });
      
      doc.save(`${workspaceTitle}_all_assignments.pdf`);
      
      setSnackbar({
        open: true,
        message: "All assignments exported as PDF successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      setSnackbar({
        open: true,
        message: "Error generating PDF. Please try again.",
        severity: "error",
      });
    }
  };

  const handleExportClick = (type) => {
    if (type === 'assignments' && csvData.length === 0 && selectedWorkspace) {
      prepareCSVData(assignments);
      setTimeout(() => csvLinkRef.current?.click(), 100);
    } else if (type === 'marks' && studentCsvData.length === 0 && selectedWorkspace) {
      prepareStudentMarksCSV(selectedWorkspace);
      setTimeout(() => studentCsvLinkRef.current?.click(), 100);
    } else if (type === 'assignmentsPdf') {
      exportAllAssignmentsPDF();
    }
    
    setSnackbar({
      open: true,
      message: `${type === 'assignmentsPdf' ? 'PDF' : type === 'assignments' ? 'Assignment' : 'Student marks'} data prepared successfully!`,
      severity: "success",
    });
  };

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (!workspace.title && "untitled workspace".includes(searchQuery.toLowerCase()))
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #0a0a18 0%, #12121e 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background:
            "linear-gradient(rgba(10, 10, 24, 0.92), rgba(10, 10, 24, 0.92))",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle at 25% 30%, rgba(187, 95, 206, 0.15) 0%, rgba(10, 10, 24, 0) 50%), " +
              "radial-gradient(circle at 75% 70%, rgba(156, 39, 176, 0.15) 0%, rgba(10, 10, 24, 0) 50%), " +
              "linear-gradient(0deg, transparent 24%, rgba(156, 39, 176, 0.08) 25%, rgba(156, 39, 176, 0.08) 26%, transparent 27%, transparent 74%, rgba(156, 39, 176, 0.08) 75%, rgba(156, 39, 176, 0.08) 76%, transparent 77%, transparent), " +
              "linear-gradient(90deg, transparent 24%, rgba(156, 39, 176, 0.08) 25%, rgba(156, 39, 176, 0.08) 26%, transparent 27%, transparent 74%, rgba(156, 39, 176, 0.08) 75%, rgba(156, 39, 176, 0.08) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px, 50px 50px, 50px 50px",
            animation: "binaryMove 60s linear infinite",
            "@keyframes binaryMove": {
              "0%": { backgroundPosition: "0 0, 0 0, 0 0" },
              "100%": { backgroundPosition: "1000px 1000px, 500px 500px, 1000px 1000px" },
            },
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at center, rgba(10, 10, 24, 0) 0%, rgba(10, 10, 24, 0.8) 100%)",
          }
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundImage: 
              "radial-gradient(circle at 15% 15%, rgba(156, 39, 176, 0.3) 0%, transparent 2%), " +
              "radial-gradient(circle at 25% 45%, rgba(156, 39, 176, 0.2) 0%, transparent 1.5%), " +
              "radial-gradient(circle at 35% 75%, rgba(156, 39, 176, 0.4) 0%, transparent 2.5%), " +
              "radial-gradient(circle at 45% 25%, rgba(156, 39, 176, 0.3) 0%, transparent 1.8%), " +
              "radial-gradient(circle at 55% 65%, rgba(156, 39, 176, 0.25) 0%, transparent 2.2%), " +
              "radial-gradient(circle at 65% 35%, rgba(156, 39, 176, 0.35) 0%, transparent 2%), " +
              "radial-gradient(circle at 75% 85%, rgba(156, 39, 176, 0.3) 0%, transparent 1.7%), " +
              "radial-gradient(circle at 85% 10%, rgba(156, 39, 176, 0.4) 0%, transparent 2.3%)",
            backgroundSize: "200% 200%",
            animation: "floatingParticles 25s ease-in-out infinite",
            "@keyframes floatingParticles": {
              "0%": { backgroundPosition: "0% 0%" },
              "25%": { backgroundPosition: "100% 0%" },
              "50%": { backgroundPosition: "100% 100%" },
              "75%": { backgroundPosition: "0% 100%" },
              "100%": { backgroundPosition: "0% 0%" }
            },
          }
        }}
      />

      <Container
        sx={{
          position: "relative", 
          zIndex: 1, 
          py: 4, 
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(18, 18, 35, 0.3)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #9c27b0 0%, #bb5fce 100%)',
            borderRadius: '4px',
            '&:hover': {
              background: 'linear-gradient(135deg, #bb5fce 0%, #9c27b0 100%)',
            }
          }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={() => navigate("/home")}
            sx={{ color: "#bb5fce", mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              background: "linear-gradient(45deg, #9c27b0 30%, #bb5fce 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}
          >
            Export Workspace Data
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: "rgba(18, 18, 35, 0.6)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(156, 39, 176, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(18, 18, 35, 0.3)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(135deg, #9c27b0 0%, #bb5fce 100%)',
              borderRadius: '4px',
              '&:hover': {
                background: 'linear-gradient(135deg, #bb5fce 0%, #9c27b0 100%)',
              }
            }
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#e0e0e0" }}>
            Select Your Workspace
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "#e0e0e0",
                "& fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.7)",
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <Box sx={{ color: "#9c27b0", mr: 1 }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 21L16.65 16.65"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
              ),
            }}
          />

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <CircularProgress sx={{ color: "#9c27b0" }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : filteredWorkspaces.length === 0 ? (
            <Typography
              variant="body1"
              sx={{ color: "rgba(224, 224, 224, 0.7)", textAlign: "center" }}
            >
              {searchQuery
                ? "No matching workspaces found"
                : "No workspaces available. You can only export data from workspaces you've created or manage."}
            </Typography>
          ) : (
            <List sx={{ 
              maxHeight: "300px", 
              overflow: "auto",
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(18, 18, 35, 0.3)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #9c27b0 0%, #bb5fce 100%)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #bb5fce 0%, #9c27b0 100%)',
                }
              }
            }}>
              {filteredWorkspaces.map((workspace) => (
                <React.Fragment key={workspace.id}>
                  <ListItem
                    button
                    onClick={() => handleWorkspaceSelect(workspace)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor:
                        selectedWorkspace?.id === workspace.id
                          ? "rgba(156, 39, 176, 0.2)"
                          : "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(156, 39, 176, 0.1)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{ color: "#e0e0e0" }}
                        >
                          {workspace.title || `Untitled Workspace ${workspace.id.slice(0, 6)}`}
                          {workspace.creator === username && (
                            <Chip 
                              label="Creator" 
                              size="small" 
                              sx={{ 
                                ml: 1, 
                                backgroundColor: "rgba(156, 39, 176, 0.2)",
                                color: "#bb5fce"
                              }} 
                            />
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(224, 224, 224, 0.7)" }}
                        >
                          Created by: {workspace.creator || "Unknown"}
                          {workspace.teachers?.includes(username) && workspace.creator !== username && (
                            <Chip 
                              label="Teacher" 
                              size="small" 
                              sx={{ 
                                ml: 1, 
                                backgroundColor: "rgba(33, 150, 243, 0.2)",
                                color: "#2196f3"
                              }} 
                            />
                          )}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ borderColor: "rgba(156, 39, 176, 0.1)" }} />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {selectedWorkspace && (
          <Box sx={{ 
            flexGrow: 1, 
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <Paper
              sx={{
                p: 3,
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(18, 18, 35, 0.6)",
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(156, 39, 176, 0.15)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                overflow: "hidden",
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(18, 18, 35, 0.3)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(135deg, #9c27b0 0%, #bb5fce 100%)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #bb5fce 0%, #9c27b0 100%)',
                  }
                }
              }}
            >
              <Typography variant="h6" sx={{ 
                color: "#e0e0e0",
                mb: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span>
                  Assignments in{" "}
                  <span style={{ color: "#bb5fce" }}>
                    {selectedWorkspace.title ||
                      `Untitled Workspace ${selectedWorkspace.id.slice(0, 6)}`}
                  </span>
                </span>
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdf />}
                  onClick={() => handleExportClick('assignmentsPdf')}
                  sx={{
                    background: "linear-gradient(135deg, #F44336 0%, #C62828 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #E53935 0%, #B71C1C 100%)",
                    },
                    boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
                  }}
                >
                  Export All Questions
                </Button>
              </Typography>

              {assignments.length === 0 ? (
                <Typography
                  variant="body1"
                  sx={{ 
                    color: "rgba(224, 224, 224, 0.7)", 
                    textAlign: "center",
                    my: 4
                  }}
                >
                  No assignments in this workspace
                </Typography>
              ) : (
                <Box sx={{ 
                  flexGrow: 1,
                  overflow: "auto",
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(18, 18, 35, 0.3)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'linear-gradient(135deg, #9c27b0 0%, #bb5fce 100%)',
                    borderRadius: '4px',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #bb5fce 0%, #9c27b0 100%)',
                    }
                  }
                }}>
                  {assignments.map((assignment, index) => {
                    const status = getAssignmentStatus(assignment);
                    const submissionCount = assignment.submissions?.length || 0;
                    const questionsCount = assignment.questions?.length || 0;
                    
                    return (
                      <Card
                        key={index}
                        sx={{
                          mb: 2,
                          background: "rgba(25, 25, 45, 0.4)",
                          border: "1px solid rgba(156, 39, 176, 0.2)",
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                          },
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ color: "#e0e0e0" }}
                            >
                              {assignment.title || "Untitled Assignment"}
                            </Typography>
                            <Box sx={{ 
                              display: "flex", 
                              gap: 2, 
                              alignItems: "center", 
                              flexWrap: "wrap" 
                            }}>
                              <Chip
                                label={`${submissionCount} ${submissionCount === 1 ? "submission" : "submissions"}`}
                                size="small"
                                sx={{
                                  backgroundColor: "rgba(25, 25, 45, 0.6)",
                                  color: "rgba(224, 224, 224, 0.7)",
                                }}
                              />
                              <Chip
                                label={`${questionsCount} ${questionsCount === 1 ? "question" : "questions"}`}
                                size="small"
                                sx={{
                                  backgroundColor: "rgba(25, 25, 45, 0.6)",
                                  color: "rgba(224, 224, 224, 0.7)",
                                }}
                              />
                              <Box
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  backgroundColor: `${status.color}20`,
                                  color: status.color,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  boxShadow: `0 0 8px ${status.color}40`,
                                }}
                              >
                                {status.label}
                              </Box>
                            </Box>
                          </Box>

                          {assignment.description && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(224, 224, 224, 0.7)",
                                mb: 1,
                              }}
                            >
                              {assignment.description.length > 150
                                ? `${assignment.description.substring(0, 150)}...`
                                : assignment.description}
                            </Typography>
                          )}
                          
                          <Box sx={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            mt: 2, 
                            flexWrap: "wrap", 
                            gap: 1 
                          }}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{ color: "rgba(224, 224, 224, 0.5)", display: "block" }}
                              >
                                Posted: {safeFormatDate(assignment.postedAt)}
                              </Typography>
                              
                              {assignment.closingDate && (
                                <Typography
                                  variant="caption"
                                  sx={{ 
                                    color: new Date().getTime() > (
                                      typeof assignment.closingDate === 'object' && assignment.closingDate.seconds 
                                        ? assignment.closingDate.seconds * 1000
                                        : typeof assignment.closingDate === 'number'
                                          ? assignment.closingDate
                                          : new Date(assignment.closingDate).getTime()
                                    )
                                      ? "rgba(244, 67, 54, 0.8)" 
                                      : "rgba(224, 224, 224, 0.5)"
                                  }}
                                >
                                  Due: {safeFormatDate(assignment.closingDate)}
                                </Typography>
                              )}
                            </Box>
                            
                            <Box sx={{ 
                              display: "flex", 
                              gap: 1,
                              flexWrap: "wrap",
                              justifyContent: "flex-end"
                            }}>
                              {assignment.questions && assignment.questions.length > 0 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PictureAsPdf />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportAssignmentQuestionsPDF(assignment);
                                  }}
                                  sx={{
                                    borderColor: "rgba(244, 67, 54, 0.5)",
                                    color: "#F44336",
                                    "&:hover": {
                                      borderColor: "#F44336",
                                      backgroundColor: "rgba(244, 67, 54, 0.1)",
                                    },
                                  }}
                                >
                                  Questions PDF
                                </Button>
                              )}
                              <CSVLink
                                data={[{
                                  "Title": assignment.title || "Untitled Assignment",
                                  "Description": assignment.description || "No description",
                                  "Posted Date": safeFormatDate(assignment.postedAt),
                                  "Due Date": safeFormatDate(assignment.closingDate),
                                  "Status": getAssignmentStatus(assignment).label,
                                  "Questions Count": assignment.questions?.length || 0,
                                  "Submissions Count": assignment.submissions?.length || 0
                                }]}
                                filename={`${assignment.title || "assignment"}_details_${format(new Date(), "yyyy-MM-dd")}.csv`}
                                style={{ textDecoration: "none" }}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Download />}
                                  sx={{
                                    borderColor: "rgba(76, 175, 80, 0.5)",
                                    color: "#4CAF50",
                                    "&:hover": {
                                      borderColor: "#4CAF50",
                                      backgroundColor: "rgba(76, 175, 80, 0.1)",
                                    },
                                  }}
                                >
                                  Export Details
                                </Button>
                              </CSVLink>
                              {assignment.submissions && assignment.submissions.length > 0 && (
                                <CSVLink
                                  data={assignment.submissions.map(submission => {
                                    const row = {
                                      "Student Name": submission.submittedBy || submission.studentName || "Unknown Student",
                                    };
                                    // Add a column for each question
                                    (assignment.questions || []).forEach((question, index) => {
                                      const questionKey = `Question ${index + 1}`;
                                      row[questionKey] = submission.marks && submission.marks[question]
                                        ? submission.marks[question]
                                        : "Not graded";
                                    });
                                    // Calculate total mark
                                    const totalMark = submission.marks
                                      ? Object.values(submission.marks).reduce((sum, mark) => {
                                          const markValue = parseFloat(mark);
                                          return isNaN(markValue) ? sum : sum + markValue;
                                        }, 0)
                                      : "Not graded";
                                    row["Total Mark"] = totalMark;
                                    return row;
                                  })}
                                  filename={`${assignment.title || "assignment"}_marks_${format(new Date(), "yyyy-MM-dd")}.csv`}
                                  style={{ textDecoration: "none" }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Download />}
                                    sx={{
                                      borderColor: "rgba(33, 150, 243, 0.5)",
                                      color: "#2196F3",
                                      "&:hover": {
                                        borderColor: "#2196F3",
                                        backgroundColor: "rgba(33, 150, 243, 0.1)",
                                      },
                                    }}
                                  >
                                    Export Marks
                                  </Button>
                                </CSVLink>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Container>

      {/* Hidden CSV links for triggering downloads */}
      <CSVLink
        data={csvData}
        filename={`${selectedWorkspace?.title || "workspace"}_assignments_${format(new Date(), "yyyy-MM-dd")}.csv`}
        ref={csvLinkRef}
        style={{ display: "none" }}
      />
      <CSVLink
        data={studentCsvData}
        filename={`${selectedWorkspace?.title || "workspace"}_student_marks_${format(new Date(), "yyyy-MM-dd")}.csv`}
        ref={studentCsvLinkRef}
        style={{ display: "none" }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            background: "rgba(18, 18, 35, 0.9)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(156, 39, 176, 0.3)",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExportWorkspaceDataScreen;