import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  IconButton,
  InputAdornment,
  Alert
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CreateScreen = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const checkAndCreateAccount = async (username, password) => {
    // Check for empty fields
    if (username.trim() === "") {
      setError("Username cannot be empty");
      return;
    }

    if (password.trim() === "") {
      setError("Password cannot be empty");
      return;
    }

    try {
      // Check if username already exists
      const userDoc = await getDoc(doc(db, "Users", username));
      
      if (userDoc.exists()) {
        setError("Username already exists");
      } else {
        // Store only the password (document ID itself is the username)
        const userMap = { password: password };
        
        await setDoc(doc(db, "Users", username), userMap);
        
        // Save user details in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", username);
        
        // Navigate to HomeScreen and clear backstack
        navigate("/home", { replace: true });
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
    }
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      backgroundColor: '#0a0a18',
      backgroundImage: `
        linear-gradient(135deg, rgba(10, 10, 24, 0.95) 0%, rgba(18, 18, 30, 0.95) 100%),
        linear-gradient(45deg, rgba(156, 39, 176, 0.1) 25%, transparent 25%, transparent 50%, rgba(156, 39, 176, 0.1) 50%, rgba(156, 39, 176, 0.1) 75%, transparent 75%, transparent),
        repeating-linear-gradient(90deg, rgba(156, 39, 176, 0.03) 0px, rgba(156, 39, 176, 0.03) 1px, transparent 1px, transparent 20px),
        repeating-linear-gradient(180deg, rgba(156, 39, 176, 0.03) 0px, rgba(156, 39, 176, 0.03) 1px, transparent 1px, transparent 20px)
      `,
      backgroundSize: '100% 100%, 500px 500px, 20px 20px, 20px 20px',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          repeating-linear-gradient(45deg, rgba(156, 39, 176, 0.01) 0px, rgba(156, 39, 176, 0.01) 1px, transparent 1px, transparent 10px),
          repeating-linear-gradient(135deg, rgba(156, 39, 176, 0.01) 0px, rgba(156, 39, 176, 0.01) 1px, transparent 1px, transparent 10px)
        `,
        backgroundSize: '30px 30px',
        opacity: 0.8,
        zIndex: 0,
        pointerEvents: 'none'
      }
    }}>
      {/* Small scattered dots */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 15% 25%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 85% 35%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 35% 65%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 25% 15%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 65% 85%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 95% 45%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px),
          radial-gradient(circle at 5% 85%, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '200px 200px',
        opacity: 0.6,
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      
      {/* Large diagonal shape */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        clipPath: 'polygon(0 0, 50% 0, 0 80%)',
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(18, 18, 30, 0) 70%)',
        opacity: 0.9,
        zIndex: 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            repeating-linear-gradient(45deg, rgba(156, 39, 176, 0.03) 0px, rgba(156, 39, 176, 0.03) 1px, transparent 1px, transparent 15px),
            repeating-linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0px, rgba(156, 39, 176, 0.03) 1px, transparent 1px, transparent 15px)
          `,
          backgroundSize: '20px 20px',
        }
      }} />
      
      {/* Second diagonal shape */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '70%',
        height: '100%',
        clipPath: 'polygon(100% 0, 100% 100%, 30% 100%)',
        background: 'linear-gradient(225deg, rgba(156, 39, 176, 0.05) 0%, rgba(18, 18, 30, 0) 70%)',
        opacity: 0.9,
        zIndex: 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            repeating-linear-gradient(45deg, rgba(156, 39, 176, 0.02) 0px, rgba(156, 39, 176, 0.02) 1px, transparent 1px, transparent 15px),
            repeating-linear-gradient(135deg, rgba(156, 39, 176, 0.02) 0px, rgba(156, 39, 176, 0.02) 1px, transparent 1px, transparent 15px)
          `,
          backgroundSize: '20px 20px',
        }
      }} />
      
      {/* Animated light rays */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          linear-gradient(45deg, transparent 0%, transparent 40%, rgba(156, 39, 176, 0.03) 50%, transparent 60%, transparent 100%),
          linear-gradient(135deg, transparent 0%, transparent 40%, rgba(156, 39, 176, 0.03) 50%, transparent 60%, transparent 100%)
        `,
        backgroundSize: '250% 250%, 250% 250%',
        animation: 'lightRays 20s linear infinite',
        opacity: 0.7,
        zIndex: 0,
        '@keyframes lightRays': {
          '0%': {
            backgroundPosition: '0% 0%, 0% 0%'
          },
          '100%': {
            backgroundPosition: '250% 250%, 250% 250%'
          }
        }
      }} />
      
      {/* Subtle cyber circuit pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.05,
        background: `
          linear-gradient(90deg, transparent 99.5%, rgba(156, 39, 176, 0.3) 99.5%),
          linear-gradient(180deg, transparent 99.5%, rgba(156, 39, 176, 0.3) 99.5%)
        `,
        backgroundSize: '50px 50px',
        zIndex: 0
      }} />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            width: '100%',
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: 'relative',
            mt: -1,
          }}
        >
          {/* CodeArena logo */}
          <Box sx={{
            mb: 4, 
            mt: 4,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Typography variant="h2" sx={{ 
              fontWeight: "bold",
              letterSpacing: '3px',
              position: 'relative',
              textShadow: '0 0 20px rgba(156, 39, 176, 0.5)',
              fontFamily: "'Orbitron', sans-serif",
              transform: 'perspective(500px) rotateX(5deg)',
            }}>
              <span style={{ 
                color: '#9c27b0', 
                background: 'linear-gradient(to right, #9c27b0, #ba68c8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                position: 'relative',
              }}>Code</span>
              <span style={{ 
                color: '#e0e0e0',
                textShadow: '0 0 15px rgba(224, 224, 224, 0.4)',
              }}>Arena</span>
            </Typography>
            
            <Box sx={{
              width: '80%',
              height: '3px',
              mt: 1.5,
              background: 'linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.8), rgba(156, 39, 176, 0))',
              borderRadius: '2px',
              boxShadow: '0 0 10px rgba(156, 39, 176, 0.6)',
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0))',
                animation: 'shimmer 2.5s infinite',
              },
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
              }
            }} />
            
            <Typography variant="subtitle1" sx={{ 
              color: 'rgba(224, 224, 224, 0.7)',
              mt: 1.5,
              fontStyle: 'italic',
              letterSpacing: '1px',
              textShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
            }}>
              Join our secure coding community
            </Typography>
          </Box>

          <Box component="form" sx={{ 
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
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: `
                repeating-linear-gradient(45deg, rgba(156, 39, 176, 0.01) 0px, rgba(156, 39, 176, 0.01) 1px, transparent 1px, transparent 10px),
                repeating-linear-gradient(135deg, rgba(156, 39, 176, 0.01) 0px, rgba(156, 39, 176, 0.01) 1px, transparent 1px, transparent 10px)
              `,
              backgroundSize: '30px 30px',
              pointerEvents: 'none',
              opacity: 0.5,
              zIndex: -1
            }
          }}>
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
              placeholder="Username"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'rgba(156, 39, 176, 0.6)' }} />
                  </InputAdornment>
                ),
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  document.getElementById('password-field').focus();
                }
              }}
            />

            <TextField
              id="password-field"
              fullWidth
              placeholder="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(156, 39, 176, 0.6)' }} />
                  </InputAdornment>
                ),
              }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  checkAndCreateAccount(name, password);
                }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={() => checkAndCreateAccount(name, password)}
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
              Create Account
            </Button>

            <Typography variant="caption" sx={{ 
              color: "rgba(200, 200, 200, 0.5)", 
              display: 'block', 
              textAlign: 'center', 
              mt: 4, 
              fontSize: '0.7rem',
            }}>
              This site is protected by reCAPTCHA and the Google 
              <a href="#" style={{ color: "#bb5fce", textDecoration: "none" }}> Privacy Policy</a> and
              <a href="#" style={{ color: "#bb5fce", textDecoration: "none" }}> Terms of Service</a> apply.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateScreen;