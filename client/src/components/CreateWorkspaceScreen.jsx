import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Container, Box, Paper, TextField } from "@mui/material";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const CreateWorkspaceScreen = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [error, setError] = useState("");
  
  // Fetch the username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "Unknown User";
    setUsername(storedUsername);
  }, []);
  
  // Generate a random string for the workspace ID
  const generateRandomString = (length) => {
    const allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => allowedChars[Math.floor(Math.random() * allowedChars.length)]).join("");
  };
  
  // Create a new Firestore document in "workspaces"
  const createWorkspace = async () => {
    if (!workspaceTitle.trim()) {
      setError("Workspace title is required");
      return;
    }
    
    const randomId = generateRandomString(6); // Generates a 6-character ID
    
    const workspaceData = {
      title: workspaceTitle.trim(),
      creator: username,
      createdAt: serverTimestamp(),
      users: [], // Empty user list
      assignments: [], // Empty assignments list
      submissions: [], // Empty submissions list
    };
    
    try {
      await setDoc(doc(db, "workspaces", randomId), workspaceData);
      alert(`Workspace "${workspaceTitle}" created with ID: ${randomId}`);
      navigate(`/workspace/${randomId}`);
    } catch (e) {
      setError(`Error creating workspace: ${e.message}`);
    }
  };
  
  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0a0a18 0%, #12121e 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(156, 39, 176, 0.03) 0%, transparent 25%), radial-gradient(circle at 70% 20%, rgba(100, 100, 200, 0.03) 0%, transparent 25%)',
        backgroundSize: '50px 50px',
        zIndex: 1,
      },
    }}>
      {/* Background elements remain the same... */}

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            width: '100%',
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: 'relative',
          }}
        >
          <Box sx={{ 
            width: "100%",
            background: 'rgba(18, 18, 35, 0.6)',
            backdropFilter: 'blur(15px)',
            padding: 4,
            borderRadius: 3,
            border: '1px solid rgba(156, 39, 176, 0.15)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(156, 39, 176, 0.2) inset',
          }}>
            <Typography variant="h4" sx={{ 
              color: '#e0e0e0', 
              mb: 3,
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(156, 39, 176, 0.4)',
              textAlign: 'center'
            }}>
              Create New Workspace
            </Typography>

            <TextField
              fullWidth
              label="Workspace Title"
              variant="outlined"
              value={workspaceTitle}
              onChange={(e) => {
                setWorkspaceTitle(e.target.value);
                setError("");
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#e0e0e0',
                  '& fieldset': {
                    borderColor: 'rgba(156, 39, 176, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(156, 39, 176, 0.8)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9c27b0',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(224, 224, 224, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#bb5fce',
                },
              }}
              error={!!error}
              helperText={error}
            />

            <Typography variant="body1" sx={{ 
              color: 'rgba(224, 224, 224, 0.8)', 
              mb: 4,
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              Give your workspace a descriptive name to help identify it later.
            </Typography>

            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 3,
              mb: 1,
            }}>
              <Button
                onClick={createWorkspace}
                variant="contained"
                disabled={!workspaceTitle.trim()}
                sx={{
                  width: '80%',
                  backgroundColor: "#9c27b0",
                  backgroundImage: 'linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)',
                  "&:hover": { 
                    backgroundColor: "#7B1FA2",
                    boxShadow: '0 0 20px rgba(156, 39, 176, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(80, 80, 80, 0.3)",
                    color: 'rgba(224, 224, 224, 0.4)',
                  },
                  height: "54px",
                  borderRadius: "27px",
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: '1.05rem',
                  letterSpacing: '0.5px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset',
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                Create Workspace
              </Button>
              
              <Button
                onClick={() => navigate('/home')}
                variant="text"
                sx={{
                  mt: 3,
                  color: "#bb5fce",
                  textTransform: "none",
                  fontWeight: "medium",
                  "&:hover": { 
                    color: "#d683e8",
                    textShadow: '0 0 8px rgba(156, 39, 176, 0.4)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Return to Dashboard
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateWorkspaceScreen;