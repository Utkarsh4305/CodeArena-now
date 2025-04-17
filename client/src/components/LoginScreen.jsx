import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TextField, Button, Typography, Container, Box, Alert, IconButton } from "@mui/material";
import { auth, db } from "../firebase/firebaseConfig"; // Firebase configuration
import { doc, getDoc } from "firebase/firestore";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "Users", username.trim()));
      if (!userDoc.exists()) {
        setError("User not found.");
        return;
      }

      // Validate password
      const storedPassword = userDoc.data().password || "";
      if (storedPassword !== password.trim()) {
        setError("Invalid credentials.");
        return;
      }

      // Login successful
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username.trim());

      setError(""); // Clear any previous errors
      navigate("/home"); // Redirect to home screen
    } catch (err) {
      setError("Failed to retrieve user data. Please try again.");
      console.error("Login error:", err.message);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
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
        background: `
          linear-gradient(90deg, rgba(100, 100, 200, 0.03) 1px, transparent 1px) 0 0 / 20px 20px,
          linear-gradient(rgba(100, 100, 200, 0.03) 1px, transparent 1px) 0 0 / 20px 20px,
          linear-gradient(135deg, rgba(100, 100, 200, 0.05) 1px, transparent 1px) 0 0 / 20px 20px,
          linear-gradient(45deg, rgba(100, 100, 200, 0.05) 1px, transparent 1px) 0 0 / 20px 20px
        `,
        zIndex: 1,
        animation: 'animatedGrid 8s linear infinite',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
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
      '@keyframes animatedGrid': {
        '0%': {
          backgroundPosition: '0 0, 0 0, 0 0, 0 0'
        },
        '100%': {
          backgroundPosition: '20px 20px, 20px 20px, 20px 20px, 20px 20px'
        }
      }
    }}>
      {/* Circuit pattern elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          linear-gradient(90deg, transparent 65%, rgba(156, 39, 176, 0.1) 65%, rgba(156, 39, 176, 0.1) 66%, transparent 66%) 0 0 / 100px 100px,
          linear-gradient(transparent 65%, rgba(156, 39, 176, 0.1) 65%, rgba(156, 39, 176, 0.1) 66%, transparent 66%) 0 0 / 100px 100px
        `,
        zIndex: 1,
        opacity: 0.3
      }} />
      
      {/* Animated circuit paths */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '20%',
          left: '-100px',
          width: '200%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(156, 39, 176, 0.3), transparent)',
          transform: 'rotate(-15deg)',
          animation: 'circuitFlow 12s linear infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '60%',
          left: '-100px',
          width: '200%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(100, 100, 200, 0.2), transparent)',
          transform: 'rotate(10deg)',
          animation: 'circuitFlow 15s linear infinite',
          animationDelay: '2s'
        },
        '@keyframes circuitFlow': {
          '0%': {
            transform: 'translateX(-100%) rotate(-15deg)'
          },
          '100%': {
            transform: 'translateX(100%) rotate(-15deg)'
          }
        }
      }} />
      
      {/* Glowing nodes */}
      <Box sx={{
        position: 'absolute',
        top: '30%',
        left: '15%',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'rgba(156, 39, 176, 0.5)',
        boxShadow: '0 0 10px 2px rgba(156, 39, 176, 0.5)',
        zIndex: 1,
        animation: 'pulse 3s ease-in-out infinite'
      }} />
      <Box sx={{
        position: 'absolute',
        top: '70%',
        right: '20%',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'rgba(100, 100, 200, 0.5)',
        boxShadow: '0 0 8px 2px rgba(100, 100, 200, 0.5)',
        zIndex: 1,
        animation: 'pulse 4s ease-in-out infinite',
        animationDelay: '1s'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '20%',
        left: '25%',
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: 'rgba(156, 39, 176, 0.4)',
        boxShadow: '0 0 6px 1px rgba(156, 39, 176, 0.4)',
        zIndex: 1,
        animation: 'pulse 3.5s ease-in-out infinite',
        animationDelay: '0.5s'
      }} />
      
      {/* Animated gradient circles */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(156, 39, 176, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        animation: 'float 8s ease-in-out infinite'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 50, 200, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        animation: 'float 10s ease-in-out infinite alternate'
      }} />
      
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
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            width: '100%',
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: 'relative',
            mt: -4, // Push entire container up to balance logo moving down
          }}
        >
          {/* Enhanced CodeArena logo */}
          <Box sx={{
            mb: 6, 
            mt: 2,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Main Logo */}
            <Typography variant="h2" sx={{ 
              fontWeight: "bold",
              letterSpacing: '3px',
              position: 'relative',
              textShadow: '0 0 20px rgba(156, 39, 176, 0.5)',
              fontFamily: "'Orbitron', sans-serif", // Futuristic font (you may need to import this)
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
            
            {/* Decorative elements for logo */}
            <Box sx={{
              width: '80%',
              height: '3px',
              mt: 1.5,
              background: 'linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.8), rgba(156, 39, 176, 0))',
              borderRadius: '2px',
              boxShadow: '0 0 10px rgba(156, 39, 176, 0.6)',
            }} />
            
            {/* Tagline */}
            <Typography variant="subtitle1" sx={{ 
              color: 'rgba(224, 224, 224, 0.7)',
              mt: 1.5,
              fontStyle: 'italic',
              letterSpacing: '1px',
              textShadow: '0 0 8px rgba(156, 39, 176, 0.3)',
            }}>
              Where code battles happen
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={{ 
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

            <TextField
              fullWidth
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
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
              InputProps={{
                endAdornment: (
                  <IconButton 
                    edge="end" 
                    onClick={toggleShowPassword}
                    sx={{ 
                      color: 'rgba(156, 39, 176, 0.6)',
                      '&:hover': {
                        color: 'rgba(156, 39, 176, 0.9)',
                      }  
                    }}
                  >
                    {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                ),
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
              Login
            </Button>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 1, 
              mb: 3,
              px: 1,
            }}>
              <Typography variant="body2" sx={{ color: "rgba(224, 224, 224, 0.8)" }}>
                New user?
              </Typography>
              <Link to="/create" style={{ 
                color: "#bb5fce", 
                textDecoration: "none", 
                fontWeight: "bold",
                transition: "all 0.2s ease-in-out",
                position: "relative",
                "&:hover": {
                  color: "#d683e8",
                  textShadow: '0 0 8px rgba(156, 39, 176, 0.4)',
                }
              }}>
                Register Now
              </Link>
            </Box>

            <Typography variant="caption" sx={{ 
              color: "rgba(200, 200, 200, 0.5)", 
              display: 'block', 
              textAlign: 'center', 
              mt: 4, 
              fontSize: '0.7rem',
            }}>
              This site is protected by reCAPTCHA and the Google 
              <Link to="#" style={{ color: "#bb5fce", textDecoration: "none" }}> Privacy Policy</Link> and
              <Link to="#" style={{ color: "#bb5fce", textDecoration: "none" }}> Terms of Service</Link> apply.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginScreen;