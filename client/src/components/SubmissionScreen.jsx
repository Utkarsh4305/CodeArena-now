import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Box,
  Container,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const SUPPORTED_LANGUAGES = {
  python: {
    display: "Python",
    template: `# Write your Python code here\n\ndef main():\n    # Your code goes here\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()`,
    indentSize: 4,
  },
  javascript: {
    display: "JavaScript",
    template: `// Write your JavaScript code here\n\nfunction main() {\n  // Your code goes here\n  console.log("Hello, World!");\n}\n\nmain();`,
    indentSize: 2,
  },
  java: {
    display: "Java",
    template: `// Write your Java code here\n\npublic class Main {\n    public static void main(String[] args) {\n        // Your code goes here\n        System.out.println("Hello, World!");\n    }\n}`,
    indentSize: 4,
  },
  c: {
    display: "C",
    template: `// Write your C code here\n\n#include <stdio.h>\n\nint main() {\n    // Your code goes here\n    printf("Hello, World!\\n");\n    return 0;\n}`,
    indentSize: 4,
  },
  cpp: {
    display: "C++",
    template: `// Write your C++ code here\n\n#include <iostream>\n\nint main() {\n    // Your code goes here\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
    indentSize: 4,
  },
};

const SubmissionScreen = () => {
  const { workspaceId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [userHasSubmitted, setUserHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [marks, setMarks] = useState({});
  const [activeTab, setActiveTab] = useState({});
  const [selectedLanguages, setSelectedLanguages] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [compilerLoading, setCompilerLoading] = useState({});
  const [compilationResults, setCompilationResults] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showEscapeWarningDialog, setShowEscapeWarningDialog] = useState(false);
  const [fullScreenExitTimer, setFullScreenExitTimer] = useState(null);
  const [fullScreenExitTimeRemaining, setFullScreenExitTimeRemaining] = useState(15);
  const [closingTime, setClosingTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const escKeyPressCountRef = useRef(parseInt(localStorage.getItem("escKeyPressCount")) || 0);
  const violationCountRef = useRef(parseInt(localStorage.getItem("violationCount")) || 0);
  const fullScreenExitCountRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const username = localStorage.getItem("username") || "";
  const isTeacher = username === "teacher";
  const textFieldRefs = useRef({});

  const shouldRequestFullscreen = () => {
    return !userHasSubmitted && !isTeacher;
  };

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceDoc = await getDoc(workspaceRef);

        if (workspaceDoc.exists()) {
          const assignmentsList = workspaceDoc.data().assignments || [];
          const assignment = assignmentsList.find((a) => a.postedAt === parseInt(assignmentId));

          if (assignment) {
            const questionList = assignment.questions || [];
            setQuestions(questionList);

            const initialTabs = {};
            const initialLanguages = {};

            questionList.forEach((q) => {
              initialTabs[q] = 0;
              initialLanguages[q] = "python";
            });

            setActiveTab(initialTabs);
            setSelectedLanguages(initialLanguages);

            const submissions = assignment.submissions || [];
            const userSubmission = submissions.find((s) => s.submittedBy === username);

            if (userSubmission) {
              setAnswers(userSubmission.answers);
              if (userSubmission.languages) {
                setSelectedLanguages(userSubmission.languages);
              }
              setUserHasSubmitted(true);
              setMarks(userSubmission.marks || {});
              setEvaluationResults(userSubmission.evaluations || {});
            }

            if (assignment.closingDate) {
              setClosingTime(assignment.closingDate);
            }
          } else {
            setQuestions([]);
          }
        } else {
          setQuestions([]);
        }
      } catch (e) {
        setError(`Error fetching assignment: ${e.message}`);
      } finally {
        setIsLoading(false);

        if (shouldRequestFullscreen()) {
          setShowPermissionsDialog(true);
        }
      }
    };

    fetchAssignment();
  }, [workspaceId, assignmentId, username]);

  useEffect(() => {
    if (!closingTime || userHasSubmitted || isTeacher) return;

    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      if (currentTime >= closingTime) {
        clearInterval(interval);
        submitAnswers();
        alert("Assignment has been auto-submitted due to reaching the closing time.");
      } else {
        setTimeRemaining(closingTime - currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [closingTime, userHasSubmitted, isTeacher]);

  useEffect(() => {
    if (!shouldRequestFullscreen()) return;

    const handleBlur = () => {
      const now = Date.now();
      lastViolationTimeRef.current = now;
      violationCountRef.current += 1;
      localStorage.setItem("violationCount", violationCountRef.current);

      logSecurityEvent("window_focus_lost", {
        count: violationCountRef.current,
        timestamp: new Date().toISOString(),
      });

      if (violationCountRef.current >= 1) {
        exitFullScreen();
        setShowEscapeWarningDialog(true);

        setFullScreenExitTimeRemaining(15);
        const timer = setInterval(() => {
          setFullScreenExitTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              if (!document.fullscreenElement && shouldRequestFullscreen()) {
                handleAutomaticSubmission();
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setFullScreenExitTimer(timer);
      }
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [shouldRequestFullscreen]);

  const requestPermissions = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
        setIsFullScreen(true);
        setShowPermissionsDialog(false);
        setShowEscapeWarningDialog(false);
        if (fullScreenExitTimer) {
          clearInterval(fullScreenExitTimer);
          setFullScreenExitTimer(null);
          setFullScreenExitTimeRemaining(15);
        }
      }
    } catch (e) {
      console.error("Failed to enter fullscreen:", e);
      alert("Failed to enter fullscreen mode. Please allow fullscreen permissions.");
    }
  };

  const exitFullScreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const logSecurityEvent = (eventType, details) => {
    console.log(`Security Event: ${eventType}`, details);
  };

  const handleAutomaticSubmission = () => {
    submitAnswers();
    alert("Your test has been automatically submitted due to security violation.");
    localStorage.removeItem("escKeyPressCount");
    localStorage.removeItem("violationCount");
    escKeyPressCountRef.current = 0;
    violationCountRef.current = 0;
    navigate(`/workspace/${workspaceId}`);
  };

  const handleEscapeKeyPress = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();

      escKeyPressCountRef.current += 1;
      localStorage.setItem("escKeyPressCount", escKeyPressCountRef.current);

      logSecurityEvent("escape_key_pressed", {
        count: escKeyPressCountRef.current,
        timestamp: new Date().toISOString(),
      });

      if (escKeyPressCountRef.current === 1) {
        exitFullScreen();
        setShowEscapeWarningDialog(true);
      } else if (escKeyPressCountRef.current >= 2) {
        setShowEscapeWarningDialog(false);
        handleAutomaticSubmission();
      }
    }
  };

  const handleWindowSwitchAttempt = (keyCombo) => {
    if (Date.now() - lastViolationTimeRef.current < 500) return;

    lastViolationTimeRef.current = Date.now();
    violationCountRef.current += 1;
    localStorage.setItem("violationCount", violationCountRef.current);

    logSecurityEvent("window_switch_attempt", {
      keyCombo: keyCombo,
      count: violationCountRef.current,
      timestamp: new Date().toISOString(),
    });

    if (violationCountRef.current === 1) {
      exitFullScreen();
      setShowEscapeWarningDialog(true);

      setFullScreenExitTimeRemaining(15);
      const timer = setInterval(() => {
        setFullScreenExitTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (!document.fullscreenElement && shouldRequestFullscreen()) {
              handleAutomaticSubmission();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setFullScreenExitTimer(timer);
    } else if (violationCountRef.current >= 2) {
      setShowEscapeWarningDialog(false);
      handleAutomaticSubmission();
    }
  };

  const handleFullScreenExit = () => {
    fullScreenExitCountRef.current += 1;
    logSecurityEvent("fullscreen_exit_attempt", {
      count: fullScreenExitCountRef.current,
      timestamp: new Date().toISOString(),
    });

    if (fullScreenExitCountRef.current >= 2) {
      handleAutomaticSubmission();
    } else {
      setShowEscapeWarningDialog(true);
    }
  };

  useEffect(() => {
    if (!shouldRequestFullscreen()) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      logSecurityEvent("right_click_attempt", { x: e.pageX, y: e.pageY });
    };

    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === "Tab" || e.key === "Escape")) {
        e.preventDefault();
        e.stopPropagation();
        handleWindowSwitchAttempt(`Alt+${e.key}`);
        return;
      }

      handleEscapeKeyPress(e);

      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "O")) {
        e.preventDefault();
        e.stopPropagation();
        logSecurityEvent("dev_tools_attempt", {
          timestamp: new Date().toISOString(),
          keyCombo: `Ctrl+Shift+${e.key.toUpperCase()}`,
        });
        return false;
      }

      const restrictedKeys = [
        { key: "Tab", modifier: "altKey", description: "Alt+Tab" },
        { key: "Tab", modifier: "ctrlKey", description: "Ctrl+Tab" },
        { key: "F4", modifier: "altKey", description: "Alt+F4" },
        { key: "n", modifier: "ctrlKey", description: "Ctrl+N (New Window)" },
        { key: "t", modifier: "ctrlKey", description: "Ctrl+T (New Tab)" },
        { key: "w", modifier: "ctrlKey", description: "Ctrl+W (Close Tab)" },
        { key: "F11", modifier: null, description: "F11 (Toggle Fullscreen)" },
        { key: "u", modifier: "ctrlKey", description: "Ctrl+U" },
        { key: "o", modifier: "ctrlKey", description: "Ctrl+O" },
        { key: "p", modifier: "ctrlKey", description: "Ctrl+P" },
        { key: "s", modifier: "ctrlKey", description: "Ctrl+S" },
        { key: "r", modifier: "ctrlKey", description: "Ctrl+R" },
        { key: "f", modifier: "ctrlKey", description: "Ctrl+F" },
        { key: "Escape", modifier: "altKey", description: "Alt+Esc" },
        { key: "`", modifier: "altKey", description: "Alt+` (Toggle Console)" },
      ];

      const matchedRestriction = restrictedKeys.find(
        (restriction) =>
          e.key.toLowerCase() === restriction.key.toLowerCase() &&
          (restriction.modifier === null || e[restriction.modifier]) &&
          (restriction.modifierCombo === undefined || e[restriction.modifierCombo])
      );

      if (matchedRestriction) {
        e.preventDefault();
        e.stopPropagation();
        logSecurityEvent("restricted_key_attempt", {
          description: matchedRestriction.description,
          keyCode: e.keyCode,
        });
        return false;
      }
    };

    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isCurrentlyFullScreen);

      if (!isCurrentlyFullScreen && shouldRequestFullscreen()) {
        handleFullScreenExit();
        setShowEscapeWarningDialog(true);

        if (fullScreenExitTimer) {
          clearInterval(fullScreenExitTimer);
        }

        setFullScreenExitTimeRemaining(15);

        const timer = setInterval(() => {
          setFullScreenExitTimeRemaining((prevTime) => {
            const newTime = prevTime - 1;

            if (newTime <= 0) {
              clearInterval(timer);
              if (!document.fullscreenElement && shouldRequestFullscreen()) {
                handleAutomaticSubmission();
              }
              return 0;
            }

            return newTime;
          });
        }, 1000);

        setFullScreenExitTimer(timer);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && shouldRequestFullscreen()) {
        logSecurityEvent("tab_visibility_change", {
          visibilityState: "hidden",
          timestamp: new Date().toISOString(),
        });
        setTimeout(() => {
          if (shouldRequestFullscreen()) {
            document.documentElement.requestFullscreen().catch((err) => {
              console.log("Failed to re-enter fullscreen:", err);
            });
          }
        }, 500);
      }
    };

    const handlePopState = (e) => {
      if (shouldRequestFullscreen()) {
        e.preventDefault();
        logSecurityEvent("history_navigation_attempt", { timestamp: new Date().toISOString() });
        window.history.pushState(null, document.title, window.location.href);
        return false;
      }
    };

    window.history.pushState(null, document.title, window.location.href);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);

    window.onbeforeunload = (e) => {
      if (shouldRequestFullscreen()) {
        logSecurityEvent("page_exit_attempt", { timestamp: new Date().toISOString() });
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave? Your submission will be lost.";
        return e.returnValue;
      }
    };

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);
      window.onbeforeunload = null;

      if (fullScreenExitTimer) {
        clearInterval(fullScreenExitTimer);
      }
    };
  }, [userHasSubmitted, isTeacher, isFullScreen, fullScreenExitTimer, navigate]);

  const handleAnswerChange = (question, answer) => {
    if (!userHasSubmitted) {
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [question]: answer,
      }));
    }
  };

  const handleKeyPress = async (question, e) => {
    if (userHasSubmitted || e.key !== "Enter") return;

    e.preventDefault();
    const textarea = textFieldRefs.current[question];
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = answers[question].slice(0, cursorPos);
    const textAfterCursor = answers[question].slice(cursorPos);
    const lines = textBeforeCursor.split("\n");
    const currentLine = lines[lines.length - 1];

    const language = selectedLanguages[question] || "python";

    try {
      const response = await fetch("http://localhost:5002/indent_line", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prev_line: currentLine,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        const indent = data.indentation;
        const newText = `${textBeforeCursor}\n${indent}${textAfterCursor}`;

        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          [question]: newText,
        }));

        setTimeout(() => {
          textarea.selectionStart = cursorPos + indent.length + 1;
          textarea.selectionEnd = cursorPos + indent.length + 1;
        }, 0);
      } else {
        console.error("Indentation error:", data.error);
      }
    } catch (e) {
      console.error("Error fetching indentation:", e);
      // Fallback to local indentation
      const indentSize = SUPPORTED_LANGUAGES[language].indentSize;
      const leadingSpaces = currentLine.match(/^\s*/)[0].length;
      let indentLevel = Math.floor(leadingSpaces / indentSize);
      if (currentLine.trim().endsWith(":")) {
        indentLevel += 1;
      }
      const indent = " ".repeat(indentLevel * indentSize);
      const newText = `${textBeforeCursor}\n${indent}${textAfterCursor}`;

      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [question]: newText,
      }));

      setTimeout(() => {
        textarea.selectionStart = cursorPos + indent.length + 1;
        textarea.selectionEnd = cursorPos + indent.length + 1;
      }, 0);
    }
  };

  const handleLanguageChange = async (question, language) => {
    if (!userHasSubmitted) {
      setSelectedLanguages((prev) => ({
        ...prev,
        [question]: language,
      }));

      const currentAnswer = answers[question] || "";
      const isEmptyOrTemplate =
        currentAnswer.trim() === "" ||
        Object.values(SUPPORTED_LANGUAGES).some((lang) => currentAnswer.trim() === lang.template.trim());

      if (isEmptyOrTemplate) {
        const template = SUPPORTED_LANGUAGES[language].template;
        setAnswers((prev) => ({
          ...prev,
          [question]: template,
        }));
      } else {
        const formattedCode = await formatCode(question, currentAnswer, language);
        setAnswers((prev) => ({
          ...prev,
          [question]: formattedCode,
        }));
      }
    }
  };

  const handleInputChange = (question, value) => {
    if (!userHasSubmitted) {
      setInputValues((prev) => ({
        ...prev,
        [question]: value,
      }));
    }
  };

  const handleTabChange = (question, newValue) => {
    setActiveTab((prev) => ({
      ...prev,
      [question]: newValue,
    }));
  };

  const handleMarksChange = async (question, value) => {
    if (isTeacher) {
      const parsedValue = value ? parseInt(value) : 0;
      setMarks((prevMarks) => ({
        ...prevMarks,
        [question]: parsedValue,
      }));

      try {
        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceDoc = await getDoc(workspaceRef);

        if (workspaceDoc.exists()) {
          const assignments = workspaceDoc.data().assignments || [];
          const updatedAssignments = assignments.map((a) => {
            if (a.postedAt === parseInt(assignmentId)) {
              const submissions = a.submissions || [];
              const updatedSubmissions = submissions.map((s) => {
                if (s.submittedBy === username) {
                  return {
                    ...s,
                    marks: {
                      ...s.marks,
                      [question]: parsedValue,
                    },
                  };
                }
                return s;
              });
              return {
                ...a,
                submissions: updatedSubmissions,
              };
            }
            return a;
          });

          await updateDoc(workspaceRef, { assignments: updatedAssignments });
        }
      } catch (e) {
        console.error("Error updating marks:", e);
        setError(`Error updating marks: ${e.message}`);
      }
    }
  };

  const handlePaste = (e) => {
    if (!isTeacher && !userHasSubmitted) {
      e.preventDefault();
      logSecurityEvent("paste_attempt", { element: e.target.name || "unknown" });
    }
  };

  const formatCode = async (question, code, overrideLanguage) => {
    if (!code.trim() || userHasSubmitted) return code;

    const language = overrideLanguage || selectedLanguages[question] || "python";

    try {
      const response = await fetch("http://localhost:5002/indentation_test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.formatted_code;
      } else {
        console.error("Formatting error:", data.error);
        return code;
      }
    } catch (e) {
      console.error("Error formatting code:", e);
      return code;
    }
  };

  const compileCode = async (question, code) => {
    if (!code.trim() || userHasSubmitted) return;

    const language = selectedLanguages[question] || "python";

    setCompilerLoading((prev) => ({
      ...prev,
      [question]: true,
    }));

    try {
      const formattedCode = await formatCode(question, code);

      setAnswers((prev) => ({
        ...prev,
        [question]: formattedCode,
      }));

      const response = await fetch("http://localhost:5002/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formattedCode,
          language: language,
          stdin: inputValues[question] || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Compilation result:", data);

      setCompilationResults((prev) => ({
        ...prev,
        [question]: data,
      }));
    } catch (e) {
      console.error("Error compiling code:", e);

      setCompilationResults((prev) => ({
        ...prev,
        [question]: {
          success: false,
          error: `Error compiling code: ${e.message}`,
        },
      }));
    } finally {
      setCompilerLoading((prev) => ({
        ...prev,
        [question]: false,
      }));
    }
  };

  const evaluateAllAnswers = async (answers) => {
    setEvaluationLoading(true);
    const evaluations = {};
    const marks = {};

    try {
      for (const [question, code] of Object.entries(answers)) {
        const language = selectedLanguages[question] || "python";

        try {
          const response = await fetch("http://localhost:5001/evaluate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question: question,
              code: code,
              language: language,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log(`Evaluation result for ${question}:`, data);

          evaluations[question] = data;
          if (data.grade) {
            marks[question] = data.grade;
          }
        } catch (e) {
          console.error(`Error evaluating code for ${question}:`, e);
          evaluations[question] = {
            success: false,
            error: e.message,
            review: e.message.includes("HTTP error")
              ? "Evaluation service unavailable. Please try again later."
              : `Failed to evaluate code: ${e.message}`,
          };
        }
      }

      setEvaluationResults(evaluations);
      setMarks(marks);
      return { evaluations, marks };
    } catch (e) {
      console.error("Error during evaluation:", e);
      throw e;
    } finally {
      setEvaluationLoading(false);
    }
  };

  const submitAnswers = async () => {
    try {
      const formattedAnswers = {};
      for (const [question, code] of Object.entries(answers)) {
        formattedAnswers[question] = await formatCode(question, code);
      }
      setAnswers(formattedAnswers);

      const { evaluations, marks } = await evaluateAllAnswers(formattedAnswers);

      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);

      if (workspaceDoc.exists()) {
        const assignments = workspaceDoc.data().assignments || [];
        const updatedAssignments = assignments.map((a) => {
          if (a.postedAt === parseInt(assignmentId)) {
            const submissions = a.submissions || [];
            const newSubmission = {
              submittedBy: username,
              submittedAt: Date.now(),
              answers: formattedAnswers,
              languages: selectedLanguages,
              marks: marks,
              evaluations: evaluations,
            };

            const updatedSubmissions = submissions.filter((s) => s.submittedBy !== username);
            updatedSubmissions.push(newSubmission);

            return {
              ...a,
              submissions: updatedSubmissions,
            };
          }
          return a;
        });

        await updateDoc(workspaceRef, { assignments: updatedAssignments });
        setUserHasSubmitted(true);
        exitFullScreen();
        logSecurityEvent("submission_successful", { timestamp: new Date().toISOString() });
        alert("Submission Successful! Your answers have been automatically evaluated.");
        navigate(`/workspace/${workspaceId}`);
      } else {
        setError("Workspace not found.");
      }
    } catch (e) {
      setError(`Error submitting answers: ${e.message}`);
    } finally {
      localStorage.removeItem("escKeyPressCount");
      localStorage.removeItem("violationCount");
      escKeyPressCountRef.current = 0;
      violationCountRef.current = 0;
      fullScreenExitCountRef.current = 0;
    }
  };

  const bypassSecurity = () => {
    setShowPermissionsDialog(false);
  };

  const formatTimeRemaining = (time) => {
    if (!time) return "00:00:00";
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((time % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: "linear-gradient(135deg, #0a0a18 0%, #12121e 100%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          zIndex: 0,
          "&::before": {
            content: '""',
            position: "absolute",
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
            backgroundSize: "200% 200%",
            animation: "holographic 15s ease infinite",
            "@keyframes holographic": {
              "0%": { backgroundPosition: "0% 0%" },
              "50%": { backgroundPosition: "100% 100%" },
              "100%": { backgroundPosition: "0% 0%" },
            },
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
            linear-gradient(to right, rgba(156, 39, 176, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 50, 200, 0.03) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          },
        }}
      >
        {[...Array(8)].map((_, i) => {
          const size = 100 + Math.random() * 200;
          const duration = 20 + Math.random() * 20;
          const delay = Math.random() * 10;
          const color = i % 2 === 0 ? "rgba(156, 39, 176, 0.1)" : "rgba(100, 50, 200, 0.1)";

          return (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                filter: "blur(20px)",
                animation: `float ${duration}s ease-in-out ${delay}s infinite`,
                "@keyframes float": {
                  "0%, 100%": { transform: "translate(0, 0)" },
                  "25%": { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)` },
                  "50%": { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)` },
                  "75%": { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)` },
                },
              }}
            />
          );
        })}
        <Box
          sx={{
            position: "absolute",
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
            backgroundSize: "100% 8px",
            animation: "scan 4s linear infinite",
            "@keyframes scan": {
              "0%": { backgroundPosition: "0 0" },
              "100%": { backgroundPosition: "0 8px" },
            },
          }}
        />
      </Box>

      {showPermissionsDialog && !userHasSubmitted && (
        <Dialog
          open={showPermissionsDialog}
          disableEscapeKeyDown
          onClose={(event, reason) => {
            if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
              setShowPermissionsDialog(false);
            }
          }}
          PaperProps={{
            sx: {
              background: "rgba(18, 18, 35, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(156, 39, 176, 0.3)",
              boxShadow: "0 0 30px rgba(156, 39, 176, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              color: "#e0e0e0",
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "1px",
              borderBottom: "1px solid rgba(156, 39, 176, 0.3)",
            }}
          >
            Exam Environment Permissions
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "#e0e0e0" }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                This exam requires fullscreen mode to maintain integrity.
              </Typography>
              <Typography variant="body1" sx={{ color: "#ff4081" }}>
                Important: By proceeding, you agree to complete this exam without leaving the browser window or exiting fullscreen mode until submission.
              </Typography>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ borderTop: "1px solid rgba(156, 39, 176, 0.3)" }}>
            {isTeacher && (
              <Button
                onClick={bypassSecurity}
                sx={{
                  color: "#bb5fce",
                  "&:hover": {
                    background: "rgba(156, 39, 176, 0.1)",
                  },
                }}
              >
                Teacher Override
              </Button>
            )}
            <Button
              onClick={requestPermissions}
              sx={{
                background: "linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)",
                color: "white",
                "&:hover": {
                  background: "#7B1FA2",
                  boxShadow: "0 0 20px rgba(156, 39, 176, 0.5)",
                },
              }}
            >
              Grant Permissions & Begin Exam
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {showEscapeWarningDialog && (
        <Dialog
          open={showEscapeWarningDialog}
          disableEscapeKeyDown
          onClose={(event, reason) => {
            if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
              setShowEscapeWarningDialog(false);
            }
          }}
          PaperProps={{
            sx: {
              background: "rgba(18, 18, 35, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 70, 70, 0.3)",
              boxShadow: "0 0 30px rgba(255, 70, 70, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              color: "#ff4081",
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "1px",
              borderBottom: "1px solid rgba(255, 70, 70, 0.3)",
            }}
          >
            Warning: Security Violation Detected
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "#e0e0e0" }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have attempted to leave the secure exam environment. Please return to full-screen mode immediately.
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  color: "#ff4081",
                  fontWeight: "bold",
                  fontFamily: "'Orbitron', sans-serif",
                  textAlign: "center",
                }}
              >
                Auto-submission in: {fullScreenExitTimeRemaining} seconds
              </Typography>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ borderTop: "1px solid rgba(255, 70, 70, 0.3)" }}>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)",
                color: "white",
                "&:hover": {
                  background: "#7B1FA2",
                  boxShadow: "0 0 20px rgba(156, 39, 176, 0.5)",
                },
              }}
              onClick={requestPermissions}
            >
              Re-enter Full-Screen
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <AppBar
        position="static"
        sx={{
          background: "rgba(18, 18, 35, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(156, 39, 176, 0.2)",
          boxShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
          zIndex: 2,
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "1px",
              color: "#e0e0e0",
              textShadow: "0 0 10px rgba(156, 39, 176, 0.5)",
            }}
          >
            Submit Assignment
          </Typography>
          {userHasSubmitted ? (
            <Chip
              label="Submitted"
              sx={{
                background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                color: "white",
                fontWeight: "bold",
              }}
            />
          ) : isFullScreen ? (
            <Chip
              label="Exam Mode Active"
              sx={{
                background: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
                color: "white",
                fontWeight: "bold",
              }}
            />
          ) : !isTeacher ? (
            <Chip
              label="Fullscreen Required"
              sx={{
                background: "linear-gradient(135deg, #F44336 0%, #D32F2F 100%)",
                color: "white",
                fontWeight: "bold",
              }}
            />
          ) : (
            <Chip
              label="Teacher Mode"
              sx={{
                background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                color: "white",
                fontWeight: "bold",
              }}
            />
          )}
          {closingTime && !userHasSubmitted && (
            <Chip
              label={`Time Remaining: ${formatTimeRemaining(timeRemaining)}`}
              sx={{
                ml: 2,
                background: "rgba(156, 39, 176, 0.3)",
                color: "white",
                fontWeight: "bold",
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "1px",
              }}
            />
          )}
        </Toolbar>
      </AppBar>

      <Container
        sx={{
          position: "absolute",
          top: "64px",
          bottom: 0,
          left: 0,
          right: 0,
          overflowY: "auto",
          overflowX: "hidden",
          py: 2,
          zIndex: 1,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(18, 18, 35, 0.3)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(156, 39, 176, 0.5)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(156, 39, 176, 0.7)",
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress sx={{ color: "#9c27b0" }} />
          </Box>
        ) : questions.length === 0 ? (
          <Typography variant="h6" sx={{ color: "#e0e0e0", textAlign: "center" }}>
            No questions found.
          </Typography>
        ) : (
          <Box sx={{ px: 2 }}>
            {!userHasSubmitted && !isTeacher && (
              <Box
                sx={{
                  p: 3,
                  mb: 3,
                  background: "rgba(255, 70, 70, 0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 70, 70, 0.3)",
                  borderRadius: 1,
                  boxShadow: "0 0 20px rgba(255, 70, 70, 0.2)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    color: "#ff4081",
                    textAlign: "center",
                    fontFamily: "'Orbitron', sans-serif",
                    letterSpacing: "1px",
                  }}
                >
                  Important: This exam is in secure mode. You must remain in full screen until submission. Attempting to exit, switch tabs, or use keyboard shortcuts will be logged. Any security violation will give you 15 seconds to return before automatic submission. Multiple violations will result in immediate submission.
                </Typography>
              </Box>
            )}

            <Typography
              variant="h6"
              sx={{
                mb: 3,
                color: "#bb5fce",
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "1px",
                textAlign: "center",
              }}
            >
              {userHasSubmitted ? "Your Submission:" : "Answer the following questions:"}
            </Typography>

            <List sx={{ mb: 4 }}>
              {questions.map((question, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    mb: 4,
                    background: "rgba(18, 18, 35, 0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(156, 39, 176, 0.2)",
                    borderRadius: 1,
                    p: 3,
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "rgba(156, 39, 176, 0.5)",
                      boxShadow: "0 0 20px rgba(156, 39, 176, 0.3)",
                    },
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: "bold",
                      mb: 2,
                      color: "#e0e0e0",
                      fontSize: "1.1rem",
                      borderLeft: "4px solid rgba(156, 39, 176, 0.7)",
                      pl: 2,
                    }}
                  >
                    {question}
                  </Typography>

                  <Box sx={{ width: "100%", mb: 2 }}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id={`language-select-${index}`} sx={{ color: "#e0e0e0" }}>
                        Programming Language
                      </InputLabel>
                      <Select
                        labelId={`language-select-${index}`}
                        value={selectedLanguages[question] || "python"}
                        label="Programming Language"
                        onChange={(e) => handleLanguageChange(question, e.target.value)}
                        disabled={userHasSubmitted}
                        sx={{
                          color: "#e0e0e0",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(156, 39, 176, 0.5)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(156, 39, 176, 0.8)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(156, 39, 176, 0.8)",
                          },
                        }}
                      >
                        {Object.entries(SUPPORTED_LANGUAGES).map(([key, { display }]) => (
                          <MenuItem
                            key={key}
                            value={key}
                            sx={{
                              background: "rgba(18, 18, 35, 0.8)",
                              color: "#e0e0e0",
                              "&:hover": {
                                background: "rgba(156, 39, 176, 0.3)",
                              },
                            }}
                          >
                            {display}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ borderBottom: 1, borderColor: "rgba(156, 39, 176, 0.3)", mb: 3 }}>
                      <Tabs
                        value={activeTab[question] || 0}
                        onChange={(e, newValue) => handleTabChange(question, newValue)}
                        sx={{
                          "& .MuiTabs-indicator": {
                            backgroundColor: "#9c27b0",
                          },
                        }}
                      >
                        <Tab
                          label="Code"
                          sx={{
                            color: activeTab[question] === 0 ? "#e0e0e0" : "rgba(224, 224, 224, 0.7)",
                            "&.Mui-selected": {
                              color: "#e0e0e0",
                            },
                          }}
                        />
                        <Tab
                          label="Input"
                          disabled={userHasSubmitted}
                          sx={{
                            color: activeTab[question] === 1 ? "#e0e0e0" : "rgba(224, 224, 224, 0.7)",
                            "&.Mui-selected": {
                              color: "#e0e0e0",
                            },
                          }}
                        />
                      </Tabs>
                    </Box>

                    {activeTab[question] === 0 ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={answers[question] || ""}
                        onChange={(e) => handleAnswerChange(question, e.target.value)}
                        onKeyDown={(e) => handleKeyPress(question, e)}
                        onPaste={handlePaste}
                        placeholder={`Write your ${
                          SUPPORTED_LANGUAGES[selectedLanguages[question] || "python"].display
                        } code here`}
                        sx={{
                          mb: 3,
                          fontFamily: "monospace",
                          "& .MuiOutlinedInput-root": {
                            color: "#e0e0e0",
                            "& fieldset": {
                              borderColor: "rgba(156, 39, 176, 0.5)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(156, 39, 176, 0.8)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "rgba(156, 39, 176, 0.8)",
                            },
                          },
                        }}
                        inputRef={(el) => (textFieldRefs.current[question] = el)}
                        InputProps={{
                          style: {
                            fontFamily: "monospace",
                            color: "#e0e0e0",
                          },
                          readOnly: userHasSubmitted,
                        }}
                      />
                    ) : (
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={inputValues[question] || ""}
                        onChange={(e) => handleInputChange(question, e.target.value)}
                        placeholder="Enter input for your code here (one input per line)"
                        sx={{
                          mb: 3,
                          "& .MuiOutlinedInput-root": {
                            color: "#e0e0e0",
                            "& fieldset": {
                              borderColor: "rgba(156, 39, 176, 0.5)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(156, 39, 176, 0.8)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "rgba(156, 39, 176, 0.8)",
                            },
                          },
                        }}
                        InputProps={{
                          style: {
                            fontFamily: "monospace",
                            color: "#e0e0e0",
                          },
                          readOnly: userHasSubmitted,
                        }}
                      />
                    )}

                    {!userHasSubmitted && (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                          variant="contained"
                          disabled={userHasSubmitted || !answers[question]}
                          onClick={() => compileCode(question, answers[question])}
                          sx={{
                            mb: 3,
                            background: "linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)",
                            "&:hover": {
                              background: "#7B1FA2",
                              boxShadow: "0 0 20px rgba(156, 39, 176, 0.5)",
                            },
                            height: "44px",
                            borderRadius: "22px",
                            textTransform: "none",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            letterSpacing: "0.5px",
                            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset",
                            transition: "all 0.3s ease-in-out",
                          }}
                        >
                          {compilerLoading[question] ? (
                            <CircularProgress size={24} sx={{ color: "white" }} />
                          ) : (
                            "Run Code"
                          )}
                        </Button>
                      </Box>
                    )}

                    {compilationResults[question] && (
                      <Box
                        sx={{
                          mt: 2,
                          width: "100%",
                          background: compilationResults[question].success
                            ? "rgba(76, 175, 80, 0.1)"
                            : "rgba(244, 67, 54, 0.1)",
                          backdropFilter: "blur(10px)",
                          p: 2,
                          borderRadius: 1,
                          border: compilationResults[question].success
                            ? "1px solid rgba(76, 175, 80, 0.5)"
                            : "1px solid rgba(244, 67, 54, 0.5)",
                          boxShadow: compilationResults[question].success
                            ? "0 0 20px rgba(76, 175, 80, 0.2)"
                            : "0 0 20px rgba(244, 67, 54, 0.2)",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: "bold",
                            color: compilationResults[question].success ? "#4CAF50" : "#F44336",
                            mb: 1,
                          }}
                        >
                          Program Output:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                            color: "#e0e0e0",
                          }}
                        >
                          {compilationResults[question].execution?.stdout ||
                            compilationResults[question].error ||
                            "(No output)"}
                        </Typography>
                      </Box>
                    )}

                    {userHasSubmitted && evaluationResults[question] && (
                      <Box
                        sx={{
                          mt: 2,
                          width: "100%",
                          background: evaluationResults[question].success
                            ? "rgba(33, 150, 243, 0.1)"
                            : "rgba(244, 67, 54, 0.1)",
                          backdropFilter: "blur(10px)",
                          p: 2,
                          borderRadius: 1,
                          border: evaluationResults[question].success
                            ? "1px solid rgba(33, 150, 243, 0.5)"
                            : "1px solid rgba(244, 67, 54, 0.5)",
                          boxShadow: evaluationResults[question].success
                            ? "0 0 20px rgba(33, 150, 243, 0.2)"
                            : "0 0 20px rgba(244, 67, 54, 0.2)",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: "bold",
                            color: evaluationResults[question].success ? "#2196F3" : "#F44336",
                            mb: 1,
                          }}
                        >
                          AI Evaluation:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace",
                            color: "#e0e0e0",
                          }}
                        >
                          {evaluationResults[question].review || evaluationResults[question].error || "(No evaluation)"}
                        </Typography>
                        {evaluationResults[question].grade && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              fontWeight: "bold",
                              color: "#e0e0e0",
                            }}
                          >
                            AI Grade: {evaluationResults[question].grade}/10
                          </Typography>
                        )}
                      </Box>
                    )}

                    {userHasSubmitted && (
                      <Box
                        sx={{
                          mt: 2,
                          width: "100%",
                          background: "rgba(156, 39, 176, 0.1)",
                          backdropFilter: "blur(10px)",
                          p: 2,
                          borderRadius: 1,
                          border: "1px solid rgba(156, 39, 176, 0.5)",
                          boxShadow: "0 0 20px rgba(156, 39, 176, 0.2)",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: "bold",
                            color: "#bb5fce",
                            mb: 1,
                          }}
                        >
                          Teacher Evaluation:
                        </Typography>
                        {isTeacher ? (
                          <TextField
                            type="number"
                            label="Teacher Marks"
                            value={marks[question] || ""}
                            onChange={(e) => handleMarksChange(question, e.target.value)}
                            inputProps={{ min: 0, max: 10 }}
                            sx={{
                              mb: 1,
                              "& .MuiOutlinedInput-root": {
                                color: "#e0e0e0",
                                "& fieldset": {
                                  borderColor: "rgba(156, 39, 176, 0.5)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "rgba(156, 39, 176, 0.8)",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "rgba(156, 39, 176, 0.8)",
                                },
                              },
                              "& .MuiInputLabel-root": {
                                color: "#e0e0e0",
                              },
                            }}
                          />
                        ) : (
                          marks[question] !== undefined && (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "bold",
                                color: "#e0e0e0",
                              }}
                            >
                              Teacher Grade: {marks[question]}/10
                            </Typography>
                          )
                        )}
                      </Box>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>

            {!userHasSubmitted && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                <Button
                  variant="contained"
                  onClick={submitAnswers}
                  disabled={evaluationLoading}
                  sx={{
                    mt: 2,
                    background: "linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)",
                    "&:hover": {
                      background: "#7B1FA2",
                      boxShadow: "0 0 20px rgba(156, 39, 176, 0.5)",
                    },
                    height: "44px",
                    borderRadius: "22px",
                    textTransform: "none",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    letterSpacing: "0.5px",
                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {evaluationLoading ? (
                    <>
                      <CircularProgress size={24} sx={{ color: "white", mr: 2 }} />
                      Submitting and Evaluating...
                    </>
                  ) : (
                    "Submit Answers"
                  )}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              background: "rgba(50, 10, 10, 0.9)",
              border: "1px solid rgba(255, 70, 70, 0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default SubmissionScreen;