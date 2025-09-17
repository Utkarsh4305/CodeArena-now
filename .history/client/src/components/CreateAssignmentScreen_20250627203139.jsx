import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Box,
  Container,
  List,
  Alert,
  IconButton,
  Grid,
  Paper,
  Modal,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

// API URL for Vercel deployment
const API_URL = "http://localhost:5001/generate-questions";

const CreateAssignmentScreen = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [activationDate, setActivationDate] = useState(null);
  const [closingDate, setClosingDate] = useState(null);
  const [openAIGeneration, setOpenAIGeneration] = useState(false);
  const [aiParams, setAIParams] = useState({
    language: "",
    topic: "",
    difficulty: "Medium",
    numQuestions: 1,
  });
  const [generating, setGenerating] = useState(false);

  // Handle AI generation modal
  const handleOpenAIGeneration = () => setOpenAIGeneration(true);
  const handleCloseAIGeneration = () => {
    setOpenAIGeneration(false);
    setError(""); // Clear error when closing modal
  };

  // Handle AI parameter changes
  const handleAIParamChange = (field, value) => {
    setAIParams((prev) => ({ ...prev, [field]: value }));
  };

  // Generate questions using AI with retry
  const generateAIQuestions = async (retries = 3) => {
  if (!aiParams.language || !aiParams.topic || !aiParams.numQuestions) {
    setError("⚠️ Please complete all AI generation fields!");
    return;
  }

  if (aiParams.numQuestions < 1 || aiParams.numQuestions > 10) {
    setError("⚠️ Number of questions must be between 1 and 10!");
    return;
  }

  setGenerating(true);
  try {
    const body = {
      language: aiParams.language,
      topic: aiParams.topic,
      difficulty: aiParams.difficulty,
      numQuestions: parseInt(aiParams.numQuestions),
    };
    console.log(`Sending POST to ${API_URL} with body:`, JSON.stringify(body, null, 2));
    console.log('Request headers:', { 'Content-Type': 'application/json' });
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log(`Response status: ${response.status}, headers:`, Object.fromEntries(response.headers));
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response body: ${errorText || '(empty)'}`);
      throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText || '(empty)'}`);
    }

    const result = await response.json();
    console.log("API Response:", result);

    if (result.success && Array.isArray(result.questions) && result.questions.length > 0) {
      setQuestions((prev) => [...prev, ...result.questions]);
      handleCloseAIGeneration();
    } else {
      throw new Error(result.error || "No valid questions returned from API");
    }
  } catch (err) {
    console.error("Error generating questions:", err);
    if (retries > 0) {
      console.warn(`Retrying... (${retries} attempts left)`);
      setTimeout(() => generateAIQuestions(retries - 1), 1000);
      return;
    }
    setError(`❌ Failed to generate questions: ${err.message}. Please check the API configuration.`);
  } finally {
    setGenerating(false);
  }
};

  // Add a question to the list
  const addQuestion = () => {
    if (questionText.trim() !== "") {
      if (questionText.length > 200) {
        setError("⚠️ Question must be less than 200 characters!");
        return;
      }

      if (editingIndex !== null) {
        const updatedQuestions = [...questions];
        updatedQuestions[editingIndex] = questionText;
        setQuestions(updatedQuestions);
        setEditingIndex(null);
      } else {
        setQuestions([...questions, questionText]);
      }
      setQuestionText("");
      setError("");
    } else {
      setError("⚠️ Enter a question!");
    }
  };

  // Delete a question
  const deleteQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  // Edit a question
  const editQuestion = (index) => {
    setQuestionText(questions[index]);
    setEditingIndex(index);
  };

  // Clear all questions
  const clearAllQuestions = () => {
    setQuestions([]);
    setError("");
  };

  // Submit assignment to Firestore
  const uploadAssignmentToFirestore = async () => {
    if (assignmentTitle.trim() === "") {
      setError("⚠️ Enter a title for the assignment!");
      return;
    }

    if (questions.length === 0) {
      setError("⚠️ Add at least one question!");
      return;
    }

    if (!activationDate) {
      setError("⚠️ Set an activation date and time!");
      return;
    }

    if (!closingDate) {
      setError("⚠️ Set an a closing date and time!");
      return;
    }

    if (closingDate <= activationDate) {
      setError("⚠️ Closing time must be after activation time!");
      return;
    }

    try {
      const newAssignment = {
        title: assignmentTitle,
        questions: questions,
        postedAt: Date.now(),
        activationDate: activationDate.getTime(),
        closingDate: closingDate.getTime(),
      };

      const workspaceRef = doc(db, "workspaces", workspaceId);
      await updateDoc(workspaceRef, {
        assignments: arrayUnion(newAssignment),
      });

      alert("✅ Assignment Posted!");
      navigate(`/workspace/${workspaceId}`);
    } catch (err) {
      setError(`❌ Failed to post assignment: ${err.message}`);
    }
  };

  // Generate pulsing stars
  const stars = Array.from({ length: 20 }).map((_, i) => {
    const size = 2 + Math.random() * 3;
    const duration = 4 + Math.random() * 4;
    const delay = Math.random() * 3;
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    return (
      <Box
        key={i}
        sx={{
          position: "absolute",
          width: `${size}px`,
          height: `${size}px`,
          background: "rgba(156, 39, 176, 0.8)",
          borderRadius: "50%",
          top: `${top}%`,
          left: `${left}%`,
          animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
          boxShadow: "0 0 6px rgba(156, 39, 176, 0.5)",
        }}
      />
    );
  });

  // Generate meteor trails
  const meteors = Array.from({ length: 6 }).map((_, i) => {
    const width = 100 + Math.random() * 200;
    const duration = 8 + Math.random() * 12;
    const delay = Math.random() * 6;
    const left = Math.random() * 100;
    return (
      <Box
        key={i}
        sx={{
          position: "absolute",
          width: `${width}px`,
          height: "1px",
          background: "linear-gradient(90deg, rgba(156, 39, 176, 0.4), transparent)",
          top: `${Math.random() * 80}%`,
          left: `${left}%`,
          animation: `meteorFall ${duration}s linear ${delay}s infinite`,
          transform: "rotate(45deg)",
        }}
      />
    );
  });

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0a0a18 0%, #12121e 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "auto",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          background: "rgba(18, 18, 35, 0.6)",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "linear-gradient(180deg, #9c27b0 0%, #7B1FA2 100%)",
          borderRadius: "4px",
          border: "1px solid rgba(18, 18, 35, 0.6)",
          boxShadow: "0 0 4px rgba(156, 39, 176, 0.4)",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: "linear-gradient(180deg, #ba68c8 0%, #9c27b0 100%)",
          boxShadow: "0 0 8px rgba(156, 39, 176, 0.7)",
        },
        scrollbarWidth: "thin",
        scrollbarColor: "#9c27b0 rgba(18, 18, 35, 0.6)",
      }}
    >
      {/* Background Layers */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "-15%",
            left: "-15%",
            width: "130%",
            height: "130%",
            background: `
              radial-gradient(circle at 25% 35%, rgba(156, 39, 176, 0.12) 0%, transparent 50%),
              radial-gradient circle at 75% 65%, rgba(100, 50, 200, 0.1) 0%, transparent 50%)
            `,
            filter: "blur(60px)",
            animation: "nebulaDrift 25s ease-in-out infinite",
            opacity: 0.5,
            "@keyframes nebulaDrift": {
              "0%, 100%": { transform: "translate(0, 0) scale(1)" },
              "50%": { transform: "translate(3%, 3%) scale(1.03)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            "@keyframes twinkle": {
              "0%, 100%": { opacity: 0.4, transform: "scale(0.8)" },
              "50%": { opacity: 1, transform: "scale(1.2)" },
            },
          }}
        >
          {stars}
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            "@keyframes meteorFall": {
              "0%": { transform: "translate(0, 0) rotate(45deg)", opacity: 1 },
              "100%": { transform: "translate(200px, 200px) rotate(45deg)", opacity: 0 },
            },
          }}
        >
          {meteors}
        </Box>
      </Box>

      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "rgba(18, 18, 35, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(156, 39, 176, 0.2)",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
          zIndex: 10,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => navigate(`/workspace/${workspaceId}`)}
            sx={{
              color: "rgba(156, 39, 176, 0.9)",
              mr: 2,
              "&:hover": {
                color: "#9c27b0",
                transform: "translateX(-2px)",
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <AssignmentIcon
            sx={{
              color: "#9c27b0",
              mr: 1.5,
              fontSize: "1.8rem",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: "600",
              letterSpacing: "1px",
              background: "linear-gradient(to right, #9c27b0, #ba68c8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Create Assignment
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate(`/workspace/${workspaceId}`)}
            sx={{
              color: "rgba(224, 224, 224, 0.9)",
              border: "1px solid rgba(156, 39, 176, 0.3)",
              borderRadius: "20px",
              px: 2,
              "&:hover": {
                backgroundColor: "rgba(156, 39, 176, 0.1)",
                borderColor: "rgba(156, 39, 176, 0.5)",
              },
            }}
          >
            Cancel
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="md"
        sx={{
          mt: 4,
          mb: 4,
          flexGrow: 1,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background: "rgba(18, 18, 35, 0.6)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(156, 39, 176, 0.15)",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(156, 39, 176, 0.2) inset",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.5), rgba(156, 39, 176, 0))",
            },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              fontWeight: "bold",
              letterSpacing: "1px",
              color: "#e0e0e0",
              textAlign: "center",
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: "60px",
                height: "3px",
                background: "linear-gradient(to right, #7B1FA2, #9c27b0)",
                borderRadius: "2px",
              },
            }}
          >
            Create a New Assignment
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: "rgba(50, 10, 10, 0.8)",
                color: "#ff8f8f",
                borderRadius: 2,
                border: "1px solid rgba(255, 70, 70, 0.2)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Assignment Title"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "rgba(25, 25, 45, 0.6)",
                "& fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.2)",
                  transition: "all 0.2s ease-in-out",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.4)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#9c27b0",
                  borderWidth: "2px",
                  boxShadow: "0 0 8px rgba(156, 39, 176, 0.3)",
                },
              },
              "& .MuiInputBase-input": {
                color: "#e0e0e0",
                padding: "16px 18px",
              },
              "& .MuiInputLabel-root": {
                color: "rgba(180, 180, 180, 0.7)",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#ba68c8",
              },
            }}
            variant="outlined"
          />

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 0.5,
                  borderRadius: 2.5,
                  background:
                    "linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(100, 50, 200, 0.1))",
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Activation Date and Time"
                    value={activationDate}
                    onChange={(newValue) => setActivationDate(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "rgba(25, 25, 51, 0.9)",
                            "& fieldset": {
                              borderColor: "transparent",
                            },
                            "&:hover fieldset": {
                              borderColor: "transparent",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "transparent",
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: "#e0e0e0",
                          },
                          "& .MuiInputLabel-root": {
                            color: "rgba(180, 180, 180, 0.7)",
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#ba68c8",
                          },
                          "& .MuiSvgIcon-root": {
                            color: "#9c27b0",
                          },
                        }}
                      />
                    )}
                    minDateTime={new Date()}
                  />
                </LocalizationProvider>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 0.5,
                  borderRadius: 2.5,
                  background:
                    "linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(100, 50, 200, 0.1))",
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Closing Date and Time"
                    value={closingDate}
                    onChange={(newValue) => setClosingDate(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "rgba(25, 25, 45, 0.9)",
                            "& fieldset": {
                              borderColor: "transparent",
                            },
                            "&:hover fieldset": {
                              borderColor: "transparent",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "transparent",
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: "#ffffff",
                          },
                          "& .MuiInputLabel-root": {
                            color: "rgba(180, 180, 180, 0.7)",
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#ba68c8",
                          },
                          "& .MuiSvgIcon-root": {
                            color: "#9c27b0",
                          },
                        }}
                      />
                    )}
                    minDateTime={activationDate || new Date()}
                  />
                </LocalizationProvider>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              p: 0.5,
              borderRadius: 2.5,
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(100, 50, 200, 0.1))",
            }}
          >
            <Grid
              container
              spacing={2}
              alignItems="center"
              sx={{
                p: 1,
                borderSpectrum: 2,
                backgroundColor: "rgba(25, 25, 45, 0.6)",
              }}
            >
              <Grid item xs={12} md={9}>
                <TextField
                  fullWidth
                  label="Enter Question"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  helperText={`${questionText.length}/200 characters`}
                  inputProps={{ maxLength: 200 }}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "rgba(25, 25, 45, 0.6)",
                      "& fieldset": {
                        borderColor: "rgba(156, 39, 176, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(156, 39, 176, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#9c27b0",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#e0e0e0",
                    },
                    "& .MuiInputLabel-root": {
                      color: "rgba(180, 180, 180, 0.7)",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#ba68c8",
                    },
                    "& .MuiFormHelperText-root": {
                      color: "rgba(180, 180, 180, 0.7)",
                      fontSize: "0.7rem",
                      marginLeft: 1,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addQuestion}
                  fullWidth
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{
                    backgroundColor: "#9c27b0",
                    backgroundImage:
                      "linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)",
                    "&:hover": {
                      backgroundColor: "#7B1FA2",
                      boxShadow: "0 0 20px rgba(156, 39, 176, 0.5)",
                      transform: "translateY(-2px)",
                    },
                    height: "50px",
                    borderRadius: "25px",
                    textTransform: "none",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    boxShadow:
                      "0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {editingIndex !== null ? "Update" : "Add"}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleOpenAIGeneration}
            fullWidth
            sx={{
              mb: 3,
              borderColor: "rgba(156, 39, 176, 0.3)",
              color: "rgba(224, 224, 224, 0.9)",
              borderRadius: "25px",
              height: "45px",
              "&:hover": {
                backgroundColor: "rgba(156, 39, 176, 0.1)",
                borderColor: "rgba(156, 39, 176, 0.5)",
              },
              textTransform: "none",
            }}
            startIcon={<AutoFixHighIcon />}
          >
            Generate Questions with AI
          </Button>

          {questions.length > 0 && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllQuestions}
              fullWidth
              sx={{
                mb: 3,
                borderColor: "rgba(156, 39, 176, 0.3)",
                color: "rgba(224, 224, 224, 0.9)",
                borderRadius: "25px",
                height: "45px",
                "&:hover": {
                  backgroundColor: "rgba(156, 39, 176, 0.1)",
                  borderColor: "rgba(156, 39, 176, 0.5)",
                },
                textTransform: "none",
              }}
              startIcon={<ClearAllIcon />}
            >
              Clear All Questions
            </Button>
          )}

          {questions.length > 0 && (
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: "rgba(180, 180, 180, 0.8)",
                textAlign: "center",
              }}
            >
              {questions.length} question{questions.length !== 1 && "s"} added
            </Typography>
          )}

          <List sx={{ mb: 3 }}>
            {questions.map((question, index) => (
              <Card
                key={index}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(25, 25, 45, 0.6)",
                  backdropFilter: "blur(5px)",
                  border: "1px solid rgba(156, 39, 176, 0.15)",
                  boxShadow:
                    "0 5px 15px rgba(0, 0, 0, 0.2), 0 0 5px rgba(156, 39, 176, 0.1) inset",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow:
                      "0 8px 20px rgba(0, 0, 0, 0.3), 0 0 8px rgba(156, 39, 176, 0.2) inset",
                    borderColor: "rgba(156, 39, 176, 0.3)",
                  },
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "5px",
                    height: "100%",
                    background: "linear-gradient(to bottom, #9c27b0, #7B1FA2)",
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#e0e0e0",
                        pl: 1,
                        flex: 1,
                      }}
                    >
                      {question}
                    </Typography>
                    <Box>
                      <IconButton
                        onClick={() => editQuestion(index)}
                        sx={{
                          color: "#ba68c8",
                          "&:hover": {
                            backgroundColor: "rgba(156, 39, 176, 0.1)",
                            color: "#9c27b0",
                          },
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => deleteQuestion(index)}
                        sx={{
                          color: "rgba(255, 100, 100, 0.7)",
                          "&:hover": {
                            backgroundColor: "rgba(255, 100, 100, 0.1)",
                            color: "rgba(255, 100, 100, 0.9)",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>

          <Button
            variant="contained"
            color="primary"
            onClick={uploadAssignmentToFirestore}
            fullWidth
            sx={{
              mt: 3,
              backgroundColor: "#9c27b0",
              backgroundImage:
                "linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)",
              "&:hover": {
                backgroundColor: "#7B1FA2",
                boxShadow: "0 0 20px rgba(156, 39, 176, 0.5)",
                transform: "translateY(-2px)",
              },
              height: "54px",
              borderRadius: "27px",
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "1.05rem",
              letterSpacing: "0.5px",
              boxShadow:
                "0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset",
              transition: "all 0.3s ease-in-out",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                top: "-50%",
                left: "-60%",
                width: "40%",
                height: "200%",
                background: "rgba(255, 255, 255, 0.1)",
                transform: "rotate(35deg)",
                transition: "all 0.6s ease-in-out",
              },
              "&:hover::after": {
                left: "120%",
              },
            }}
          >
            Post Assignment
          </Button>
        </Paper>
      </Container>

      <Modal
        open={openAIGeneration}
        onClose={handleCloseAIGeneration}
        aria-labelledby="ai-generation-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "rgba(18, 18, 35, 0.95)",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            border: "1px solid rgba(156, 39, 176, 0.2)",
          }}
        >
          <Typography
            id="ai-generation-modal"
            variant="h6"
            sx={{
              mb: 3,
              color: "#e0e0e0",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Generate Questions with AI
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: "rgba(180, 180, 180, 0.7)" }}>
              Programming Language
            </InputLabel>
            <Select
              value={aiParams.language}
              onChange={(e) => handleAIParamChange("language", e.target.value)}
              sx={{
                color: "#e0e0e0",
                backgroundColor: "rgba(25, 25, 45, 0.6)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(156, 39, 176, 0.2)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(156, 39, 176, 0.4)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#9c27b0",
                },
              }}
            >
              <MenuItem value="Java">Java</MenuItem>
              <MenuItem value="C++">C++</MenuItem>
              <MenuItem value="Python">Python</MenuItem>
              <MenuItem value="JavaScript">JavaScript</MenuItem>
              <MenuItem value="C">C</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Topic"
            value={aiParams.topic}
            onChange={(e) => handleAIParamChange("topic", e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(25, 25, 45, 0.6)",
                "& fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.2)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.4)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#9c27b0",
                },
              },
              "& .MuiInputBase-input": {
                color: "#e0e0e0",
              },
              "& .MuiInputLabel-root": {
                color: "rgba(180, 180, 180, 0.7)",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#ba68c8",
              },
            }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: "rgba(180, 180, 180, 0.7)" }}>
              Difficulty
            </InputLabel>
            <Select
              value={aiParams.difficulty}
              onChange={(e) => handleAIParamChange("difficulty", e.target.value)}
              sx={{
                color: "#e0e0e0",
                backgroundColor: "rgba(25, 25, 45, 0.6)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(156, 39, 176, 0.2)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(156, 39, 176, 0.4)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#9c27b0",
                },
              }}
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Number of Questions"
            type="number"
            value={aiParams.numQuestions}
            onChange={(e) =>
              handleAIParamChange("numQuestions", parseInt(e.target.value))
            }
            inputProps={{ min: 1, max: 10 }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(25, 25, 45, 0.6)",
                "& fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.2)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(156, 39, 176, 0.4)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#9c27b0",
                },
              },
              "& .MuiInputBase-input": {
                color: "#e0e0e0",
              },
              "& .MuiInputLabel-root": {
                color: "rgba(180, 180, 180, 0.7)",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#ba68c8",
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => generateAIQuestions()}
            fullWidth
            disabled={generating}
            sx={{
              backgroundColor: "#9c27b0",
              "&:hover": {
                backgroundColor: "#7B1FA2",
                boxShadow: "0 0 20px rgba(156, 39, 176, 0.5)",
              },
            }}
          >
            {generating ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Generate Questions"
            )}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default CreateAssignmentScreen;