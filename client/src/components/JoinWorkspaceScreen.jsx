import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Container, Box, Alert, IconButton } from "@mui/material";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // Firebase configuration

const JoinWorkspaceScreen = () => {
  const navigate = useNavigate();
  const [workspaceCode, setWorkspaceCode] = useState("");
  const [error, setError] = useState("");
  const username = localStorage.getItem("username") || "Guest"; // Fetch username from localStorage

  // Join a workspace in Firestore
  const joinWorkspace = async () => {
    if (!workspaceCode) {
      setError("Please enter a workspace code.");
      return;
    }

    try {
      const workspaceRef = doc(db, "workspaces", workspaceCode);
      const workspaceDoc = await getDoc(workspaceRef);

      if (!workspaceDoc.exists()) {
        setError("Workspace not found.");
        return;
      }

      const users = workspaceDoc.data().users || [];

      // Check if the user is already in the workspace
      if (users.includes(username)) {
        setError("You are already a member of this workspace.");
        return;
      }

      // Add the user to the 'users' array in Firestore
      await updateDoc(workspaceRef, {
        users: arrayUnion(username),
      });

      setError(""); // Clear any previous errors
      alert("Successfully joined workspace!"); // Show success message
      navigate("/home"); // Navigate to home after joining
    } catch (e) {
      setError(`Error: ${e.message}`); // Show error message
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
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(100, 100, 200, 0.03) 0px, rgba(100, 100, 200, 0.03) 2px, transparent 2px, transparent 4px)',
        zIndex: 1,
      },
    }}>
      {/* New background elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 0,
      }}>
        {/* Animated particles */}
        {Array.from({ length: 15 }).map((_, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              width: Math.random() * 5 + 1 + 'px',
              height: Math.random() * 5 + 1 + 'px',
              backgroundColor: 'rgba(156, 39, 176, 0.3)',
              borderRadius: '50%',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              boxShadow: '0 0 10px rgba(156, 39, 176, 0.5)',
              animation: `float${index % 3} ${10 + index % 10}s linear infinite`,
              '@keyframes float0': {
                '0%': { transform: 'translateY(0) translateX(0)' },
                '50%': { transform: 'translateY(-100px) translateX(50px)' },
                '100%': { transform: 'translateY(0) translateX(0)' }
              },
              '@keyframes float1': {
                '0%': { transform: 'translateY(0) translateX(0)' },
                '50%': { transform: 'translateY(100px) translateX(-70px)' },
                '100%': { transform: 'translateY(0) translateX(0)' }
              },
              '@keyframes float2': {
                '0%': { transform: 'translateY(0) translateX(0)' },
                '50%': { transform: 'translateY(-70px) translateX(-40px)' },
                '100%': { transform: 'translateY(0) translateX(0)' }
              },
            }}
          />
        ))}

        {/* Digital circuit lines */}
        <Box sx={{
          position: 'absolute',
          top: '30%',
          left: '-10%',
          width: '120%',
          height: '1px',
          background: 'linear-gradient(90deg, rgba(156, 39, 176, 0) 0%, rgba(156, 39, 176, 0.2) 20%, rgba(156, 39, 176, 0.2) 80%, rgba(156, 39, 176, 0) 100%)',
          boxShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
          transform: 'rotate(5deg)',
        }} />
        
        <Box sx={{
          position: 'absolute',
          top: '70%',
          left: '-10%',
          width: '120%',
          height: '1px',
          background: 'linear-gradient(90deg, rgba(156, 39, 176, 0) 0%, rgba(156, 39, 176, 0.2) 20%, rgba(156, 39, 176, 0.2) 80%, rgba(156, 39, 176, 0) 100%)',
          boxShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
          transform: 'rotate(-8deg)',
        }} />

        {/* Vertical circuit line with dots */}
        <Box sx={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '1px',
          height: '60%',
          background: 'linear-gradient(180deg, rgba(156, 39, 176, 0) 0%, rgba(156, 39, 176, 0.2) 20%, rgba(156, 39, 176, 0.2) 80%, rgba(156, 39, 176, 0) 100%)',
          boxShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '30%',
            left: '-4px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: 'rgba(156, 39, 176, 0.3)',
            boxShadow: '0 0 10px rgba(156, 39, 176, 0.6)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '70%',
            left: '-4px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: 'rgba(156, 39, 176, 0.3)',
            boxShadow: '0 0 10px rgba(156, 39, 176, 0.6)',
          },
        }} />

        <Box sx={{
          position: 'absolute',
          top: '20%',
          right: '25%',
          width: '1px',
          height: '60%',
          background: 'linear-gradient(180deg, rgba(156, 39, 176, 0) 0%, rgba(156, 39, 176, 0.2) 20%, rgba(156, 39, 176, 0.2) 80%, rgba(156, 39, 176, 0) 100%)',
          boxShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '40%',
            left: '-4px',
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: 'rgba(156, 39, 176, 0.3)',
            boxShadow: '0 0 10px rgba(156, 39, 176, 0.6)',
          },
        }} />

        {/* Hexagonal grid in the corner */}
        <Box sx={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          width: '200px',
          height: '200px',
          opacity: 0.15,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15L30 0z' stroke-width='1' stroke='%239C27B0' fill='none' /%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />

        {/* Glowing orb with pulsating effect */}
        <Box sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(156, 39, 176, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(20px)',
          animation: 'pulse 8s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { opacity: 0.3, transform: 'scale(1)' },
            '50%': { opacity: 0.7, transform: 'scale(1.2)' },
            '100%': { opacity: 0.3, transform: 'scale(1)' }
          },
        }} />
      </Box>
      
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
          <Box component="form" onSubmit={(e) => {
            e.preventDefault();
            joinWorkspace();
          }} sx={{ 
            width: "100%",
            background: 'rgba(18, 18, 35, 0.6)',
            backdropFilter: 'blur(15px)',
            padding: 4,
            borderRadius: 3,
            border: '1px solid rgba(156, 39, 176, 0.15)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(156, 39, 176, 0.2) inset',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.5), rgba(156, 39, 176, 0))',
            }
          }}>
            <Typography variant="h4" sx={{ 
              mb: 4,
              color: '#e0e0e0',
              textAlign: 'center',
              fontWeight: "bold",
              letterSpacing: '2px',
              position: 'relative',
              textShadow: '0 0 15px rgba(156, 39, 176, 0.3)',
            }}>
              Join Workspace
            </Typography>

            {error && <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                backgroundColor: 'rgba(50, 10, 10, 0.8)', 
                color: '#ff8f8f',
                borderRadius: 2,
                border: '1px solid rgba(255, 70, 70, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              {error}
            </Alert>}

            <TextField
              fullWidth
              placeholder="Workspace Code"
              variant="outlined"
              value={workspaceCode}
              onChange={(e) => setWorkspaceCode(e.target.value)}
              margin="normal"
              required
              autoFocus
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(25, 25, 45, 0.6)',
                  '& fieldset': {
                    borderColor: 'rgba(156, 39, 176, 0.2)',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(156, 39, 176, 0.4)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#9c27b0',
                    borderWidth: '2px',
                    boxShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#e0e0e0',
                  padding: '16px 18px',
                  '&::placeholder': {
                    color: 'rgba(180, 180, 180, 0.7)',
                    opacity: 1,
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 3,
                backgroundColor: "#9c27b0",
                backgroundImage: 'linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)',
                "&:hover": { 
                  backgroundColor: "#7B1FA2",
                  boxShadow: '0 0 20px rgba(156, 39, 176, 0.5)',
                  transform: 'translateY(-2px)',
                },
                height: "54px",
                borderRadius: "27px",
                textTransform: "none",
                fontWeight: "bold",
                fontSize: '1.05rem',
                letterSpacing: '0.5px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset',
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-60%',
                  width: '40%',
                  height: '200%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'rotate(35deg)',
                  transition: 'all 0.6s ease-in-out',
                },
                '&:hover::after': {
                  left: '120%',
                },
              }}
            >
              Join Workspace
            </Button>

            <Button
              variant="text"
              fullWidth
              onClick={() => navigate("/home")}
              sx={{
                color: "#bb5fce",
                "&:hover": { 
                  backgroundColor: "rgba(156, 39, 176, 0.1)",
                  color: "#d683e8",
                  textShadow: '0 0 8px rgba(156, 39, 176, 0.4)',
                },
                textTransform: "none",
                fontSize: '0.9rem',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Back to Home
            </Button>

            <Typography variant="body2" sx={{ 
              color: "rgba(224, 224, 224, 0.6)", 
              textAlign: 'center', 
              mt: 4, 
              fontSize: '0.8rem',
            }}>
              Entering a valid workspace code will add you to the team's workspace.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default JoinWorkspaceScreen;