import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Avatar,
  TextField,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert,
  Container,
} from "@mui/material";
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Workspaces as WorkspacesIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const username = localStorage.getItem("username") || "";

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) return;

      try {
        const userDoc = await getDoc(doc(db, "Users", username));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setEditedName(data.name || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setSnackbar({
          open: true,
          message: "Failed to load user data",
          severity: "error",
        });
      }
    };

    fetchUserData();
  }, [username]);

  // Handle name update
  const handleUpdateName = async () => {
    if (!username || !editedName.trim()) return;

    try {
      await updateDoc(doc(db, "Users", username), {
        name: editedName.trim(),
      });
      setUserData({ ...userData, name: editedName.trim() });
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: "Name updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating name:", error);
      setSnackbar({
        open: true,
        message: "Failed to update name",
        severity: "error",
      });
    }
  };

  // Handle logout
  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    navigate("/");
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(90deg, rgba(100, 100, 200, 0.03) 1px, transparent 1px) 0 0 / 20px 20px,
            linear-gradient(rgba(100, 100, 200, 0.03) 1px, transparent 1px) 0 0 / 20px 20px,
            linear-gradient(135deg, rgba(100, 100, 200, 0.05) 1px, transparent 1px) 0 0 / 20px 20px,
            linear-gradient(45deg, rgba(100, 100, 200, 0.05) 1px, transparent 1px) 0 0 / 20px 20px
          `,
          zIndex: 1,
          animation: "animatedGrid 8s linear infinite",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(156, 39, 176, 0.1) 0%, transparent 25%),
            radial-gradient(circle at 80% 70%, rgba(100, 50, 200, 0.1) 0%, transparent 25%),
            linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(30, 30, 60, 0) 50%)
          `,
          zIndex: 1,
        },
        "@keyframes animatedGrid": {
          "0%": {
            backgroundPosition: "0 0, 0 0, 0 0, 0 0",
          },
          "100%": {
            backgroundPosition: "20px 20px, 20px 20px, 20px 20px, 20px 20px",
          },
        },
      }}
    >
      {/* Circuit board pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          opacity: 0.15,
          background: `
            linear-gradient(90deg, transparent 65%, rgba(156, 39, 176, 0.1) 65%, rgba(156, 39, 176, 0.1) 66%, transparent 66%) 0 0 / 100px 100px,
            linear-gradient(transparent 65%, rgba(156, 39, 176, 0.1) 65%, rgba(156, 39, 176, 0.1) 66%, transparent 66%) 0 0 / 100px 100px
          `,
        }}
      />

      {/* Animated circuit paths */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: 1,
          "&::before": {
            content: '""',
            position: "absolute",
            top: "20%",
            left: "-100px",
            width: "200%",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(156, 39, 176, 0.3), transparent)",
            transform: "rotate(-15deg)",
            animation: "circuitFlow 12s linear infinite",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: "60%",
            left: "-100px",
            width: "200%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(100, 100, 200, 0.2), transparent)",
            transform: "rotate(10deg)",
            animation: "circuitFlow 15s linear infinite",
            animationDelay: "2s",
          },
          "@keyframes circuitFlow": {
            "0%": {
              transform: "translateX(-100%) rotate(-15deg)",
            },
            "100%": {
              transform: "translateX(100%) rotate(-15deg)",
            },
          },
        }}
      />

      {/* Glowing nodes */}
      {[...Array(10)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            top: `${10 + Math.random() * 80}%`,
            left: `${5 + Math.random() * 90}%`,
            width: `${4 + Math.random() * 6}px`,
            height: `${4 + Math.random() * 6}px`,
            borderRadius: "50%",
            background: `rgba(${
              Math.random() > 0.5 ? "156, 39, 176" : "100, 100, 200"
            }, ${0.3 + Math.random() * 0.4})`,
            boxShadow: `0 0 ${8 + Math.random() * 8}px ${
              1 + Math.random() * 2
            }px rgba(${
              Math.random() > 0.5 ? "156, 39, 176" : "100, 100, 200"
            }, ${0.3 + Math.random() * 0.4})`,
            zIndex: 1,
            animation: `pulse ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* AppBar */}
      <Box
        sx={{
          background: "rgba(18, 18, 35, 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(156, 39, 176, 0.3)",
          boxShadow: "0 5px 20px rgba(0, 0, 0, 0.2)",
          zIndex: 10,
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <IconButton
            onClick={() => navigate("/home")}
            sx={{
              color: "rgba(156, 39, 176, 0.9)",
              "&:hover": {
                color: "#9c27b0",
                transform: "translateX(-2px)",
                backgroundColor: "rgba(156, 39, 176, 0.1)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "700",
              letterSpacing: "1.5px",
              background: "linear-gradient(to right, #9c27b0, #ba68c8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 12px rgba(156, 39, 176, 0.4)",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            CodeMaster Profile
          </Typography>
          <Box sx={{ width: 40 }} /> {/* Spacer for alignment */}
        </Box>
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          mt: 5,
          mb: 5,
          flexGrow: 1,
          position: "relative",
          zIndex: 2,
        }}
      >
        {userData ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              background: "rgba(18, 18, 35, 0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(156, 39, 176, 0.2)",
              boxShadow:
                "0 15px 50px rgba(0, 0, 0, 0.3), 0 0 20px rgba(156, 39, 176, 0.25) inset",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background:
                  "linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.7), rgba(156, 39, 176, 0))",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                background:
                  "linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.7), rgba(156, 39, 176, 0))",
              },
            }}
          >
            {/* User Profile Section */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 5,
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mb: 3,
                  background: "linear-gradient(135deg, #9c27b0, #ba68c8)",
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  boxShadow: "0 0 25px rgba(156, 39, 176, 0.6)",
                  border: "2px solid rgba(156, 39, 176, 0.3)",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                {userData.name
                  ? userData.name.charAt(0).toUpperCase()
                  : username.charAt(0).toUpperCase()}
              </Avatar>

              {isEditing ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    width: "100%",
                    maxWidth: "400px",
                    mb: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "rgba(25, 25, 45, 0.8)",
                        "& fieldset": {
                          borderColor: "rgba(156, 39, 176, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(156, 39, 176, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#9c27b0",
                          borderWidth: "2px",
                          boxShadow: "0 0 10px rgba(156, 39, 176, 0.4)",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#e0e0e0",
                        py: 1.5,
                        fontFamily: "'Roboto Mono', monospace",
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleUpdateName}
                    sx={{
                      color: "#4caf50",
                      "&:hover": {
                        backgroundColor: "rgba(76, 175, 80, 0.2)",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setIsEditing(false)}
                    sx={{
                      color: "#f44336",
                      "&:hover": {
                        backgroundColor: "rgba(244, 67, 54, 0.2)",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      color: "#e0e0e0",
                      textAlign: "center",
                      fontFamily: "'Roboto Mono', monospace",
                      letterSpacing: "1px",
                      textShadow: "0 0 10px rgba(156, 39, 176, 0.3)",
                    }}
                  >
                    {userData.name || username}
                  </Typography>
                  <IconButton
                    onClick={() => setIsEditing(true)}
                    sx={{
                      color: "rgba(224, 224, 224, 0.7)",
                      "&:hover": {
                        color: "#9c27b0",
                        backgroundColor: "rgba(156, 39, 176, 0.2)",
                        transform: "rotate(90deg)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              )}

              <Typography
                variant="body1"
                sx={{
                  color: "rgba(224, 224, 224, 0.7)",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontFamily: "'Roboto Mono', monospace",
                }}
              >
                <EmailIcon fontSize="small" sx={{ color: "#9c27b0" }} />
                {username}
              </Typography>
            </Box>

            <Divider
              sx={{
                my: 4,
                background:
                  "linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.6), rgba(156, 39, 176, 0))",
                height: "1px",
              }}
            />

            {/* User Stats Section */}
            <Typography
              variant="h6"
              sx={{
                color: "#e0e0e0",
                fontWeight: "bold",
                mb: 3,
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "1px",
                textShadow: "0 0 8px rgba(156, 39, 176, 0.3)",
              }}
            >
              Coding Stats
            </Typography>
            <List sx={{ width: "100%" }}>
              <ListItem
                sx={{
                  py: 2,
                  px: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(25, 25, 45, 0.8)",
                  mb: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(25, 25, 45, 1)",
                    transform: "translateX(5px)",
                    boxShadow: "0 5px 15px rgba(156, 39, 176, 0.2)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "#9c27b0", fontSize: 30 }}>
                  <WorkspacesIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Workspaces"
                  secondary={
                    userData.workspaces
                      ? `${userData.workspaces.length} joined`
                      : "0 joined"
                  }
                  primaryTypographyProps={{
                    color: "#e0e0e0",
                    fontWeight: "bold",
                    fontFamily: "'Roboto Mono', monospace",
                  }}
                  secondaryTypographyProps={{
                    color: "rgba(224, 224, 224, 0.7)",
                    fontFamily: "'Roboto Mono', monospace",
                  }}
                />
              </ListItem>
              <ListItem
                sx={{
                  py: 2,
                  px: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(25, 25, 45, 0.8)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(25, 25, 45, 1)",
                    transform: "translateX(5px)",
                    boxShadow: "0 5px 15px rgba(156, 39, 176, 0.2)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "#9c27b0", fontSize: 30 }}>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Assignments"
                  secondary={
                    userData.assignments
                      ? `${userData.assignments.length} completed`
                      : "0 completed"
                  }
                  primaryTypographyProps={{
                    color: "#e0e0e0",
                    fontWeight: "bold",
                    fontFamily: "'Roboto Mono', monospace",
                  }}
                  secondaryTypographyProps={{
                    color: "rgba(224, 224, 224, 0.7)",
                    fontFamily: "'Roboto Mono', monospace",
                  }}
                />
              </ListItem>
            </List>

            <Divider
              sx={{
                my: 4,
                background:
                  "linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.6), rgba(156, 39, 176, 0))",
                height: "1px",
              }}
            />

            {/* Actions Section */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={handleLogout}
                startIcon={<LockIcon />}
                sx={{
                  backgroundColor: "#9c27b0",
                  backgroundImage:
                    "linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)",
                  "&:hover": {
                    backgroundColor: "#7B1FA2",
                    boxShadow: "0 0 25px rgba(156, 39, 176, 0.6)",
                    transform: "scale(1.05)",
                  },
                  borderRadius: "30px",
                  textTransform: "none",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  fontFamily: "'Roboto Mono', monospace",
                  boxShadow:
                    "0 5px 20px rgba(0, 0, 0, 0.4), 0 0 8px rgba(156, 39, 176, 0.5) inset",
                  transition: "all 0.3s ease-in-out",
                  px: 4,
                  py: 1.5,
                }}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(18, 18, 35, 0.7)",
              borderRadius: 4,
              border: "1px solid rgba(156, 39, 176, 0.2)",
              boxShadow: "0 15px 50px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "rgba(224, 224, 224, 0.8)",
                fontFamily: "'Roboto Mono', monospace",
              }}
            >
              Loading profile data...
            </Typography>
          </Box>
        )}
      </Container>

      {/* Snackbar for showing messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(18, 18, 35, 0.9)",
            color: "#e0e0e0",
            fontFamily: "'Roboto Mono', monospace",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Animation keyframes */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        @keyframes pulse {
          0% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
    </Box>
  );
};

export default ProfileScreen;