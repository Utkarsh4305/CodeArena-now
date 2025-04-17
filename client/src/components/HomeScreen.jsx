import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Box,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Grid,
  Avatar,
  Divider,
  ListItemIcon,
  Paper,
} from "@mui/material";
import {
  Person as PersonIcon,
  Create as CreateIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

// Enhanced theme with more vibrant colors
const codeArenaTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#9c27b0",
      light: "#ba68c8",
      dark: "#7B1FA2",
    },
    secondary: {
      main: "#673AB7",
    },
    background: {
      default: "#0a0a18",
      paper: "#12121e",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#bb5fce",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h6: {
      fontWeight: 600,
      color: "#bb5fce",
    },
    h4: {
      fontWeight: 700,
      color: "#e0e0e0",
      letterSpacing: "-0.5px",
    },
    body1: {
      color: "#e0e0e0",
    },
    caption: {
      color: "rgba(224, 224, 224, 0.7)",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(18, 18, 35, 0.6)',
          backdropFilter: 'blur(15px)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          border: '1px solid rgba(156, 39, 176, 0.15)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 28px rgba(156, 39, 176, 0.4)',
            borderColor: 'rgba(156, 39, 176, 0.4)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '0.5px',
          borderRadius: '27px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.5) inset',
          '&:hover': {
            background: 'linear-gradient(135deg, #8E24AA 0%, #6A1B9A 100%)',
            boxShadow: '0 0 20px rgba(156, 39, 176, 0.5)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 10, 24, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(156, 39, 176, 0.15)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(18, 18, 35, 0.6)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(156, 39, 176, 0.15)',
        },
      },
    },
  },
});

const HomeScreen = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const username = localStorage.getItem("username") || "User";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  const drawerContent = (
    <Box sx={{ 
      width: 280, 
      height: '100%', 
      background: 'linear-gradient(180deg, #12121e 0%, #0a0a18 100%)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(156, 39, 176, 0.15)',
    }}>
      <Box sx={{ 
        p: 3,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(156, 39, 176, 0.1)',
      }}>
        <Avatar sx={{ 
          width: 48, 
          height: 48, 
          bgcolor: 'rgba(156, 39, 176, 0.3)',
          mr: 2,
          border: '1px solid rgba(156, 39, 176, 0.5)',
        }}>
          <PersonIcon sx={{ color: '#d683e8' }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} color="#bb5fce">{username}</Typography>
          <Typography variant="body2" color="rgba(224, 224, 224, 0.7)">Code Warrior</Typography>
        </Box>
      </Box>
      
      <List sx={{ p: 2, flex: 1 }}>
        <ListItem button sx={{ borderRadius: 2, mb: 1, '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' } }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DashboardIcon sx={{ color: '#9c27b0' }} />
          </ListItemIcon>
          <ListItemText primary="Dashboard" primaryTypographyProps={{ color: '#e0e0e0' }} />
        </ListItem>
        <ListItem button sx={{ borderRadius: 2, mb: 1, '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' } }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AssignmentIcon sx={{ color: '#9c27b0' }} />
          </ListItemIcon>
          <ListItemText primary="My Assignments" primaryTypographyProps={{ color: '#e0e0e0' }} />
        </ListItem>
        <ListItem button sx={{ borderRadius: 2, mb: 1, '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' } }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <NotificationsIcon sx={{ color: '#9c27b0' }} />
          </ListItemIcon>
          <ListItemText primary="Notifications" primaryTypographyProps={{ color: '#e0e0e0' }} />
        </ListItem>
        <ListItem button sx={{ borderRadius: 2, mb: 1, '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' } }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SettingsIcon sx={{ color: '#9c27b0' }} />
          </ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ color: '#e0e0e0' }} />
        </ListItem>
      </List>
      
      <Box sx={{ p: 2, borderTop: '1px solid rgba(156, 39, 176, 0.1)' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<LogoutIcon />}
          onClick={() => setIsLogoutDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #E63762 0%, #E64129 100%)',
              boxShadow: '0 0 20px rgba(255, 75, 43, 0.5)',
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  const CardButton = ({ text, icon, onClick }) => (
    <Card
      onClick={onClick}
      sx={{
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(156, 39, 176, 0.3)',
        '&:hover': {
          borderColor: 'rgba(156, 39, 176, 0.6)',
          '&::after': {
            opacity: 0.1,
          },
          '& .card-icon': {
            transform: 'scale(1.1)',
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(156, 39, 176, 0.3) 0%, transparent 70%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
      }}
    >
      <CardContent sx={{ 
        position: 'relative', 
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 2,
          }}
        >
          <Box className="card-icon" sx={{ 
            p: 2,
            borderRadius: '50%',
            backgroundColor: 'rgba(156, 39, 176, 0.2)',
            border: '1px solid rgba(156, 39, 176, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            transition: 'all 0.3s ease',
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 36, color: "#9c27b0" } })}
          </Box>
          <Typography variant="h6" sx={{ 
            color: "#e0e0e0", 
            textAlign: "center", 
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}>
            {text}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={codeArenaTheme}>
      <CssBaseline />
      <Box sx={{ 
        display: "flex",
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a18 0%, #12121e 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Enhanced Futuristic Cyber Background */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}>
          {/* Base Background */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at top left, rgba(78, 20, 140, 0.15) 0%, rgba(15, 15, 35, 1) 60%)',
          }} />
          
          {/* Animated cyber circuit pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.06,
            background: `
              repeating-linear-gradient(0deg, rgba(156, 39, 176, 0.5) 0, rgba(156, 39, 176, 0.5) 1px, transparent 1px, transparent 30px),
              repeating-linear-gradient(90deg, rgba(156, 39, 176, 0.5) 0, rgba(156, 39, 176, 0.5) 1px, transparent 1px, transparent 40px)
            `,
            transform: 'skew(-5deg, -2deg) scale(1.1)',
            animation: 'moveGrid 20s linear infinite',
            '@keyframes moveGrid': {
              '0%': { backgroundPosition: '0 0' },
              '100%': { backgroundPosition: '30px 30px' },
            },
          }} />
          
          {/* Digital data wave effect */}
          <Box sx={{
            position: 'absolute',
            top: '15%',
            left: '-10%',
            width: '120%',
            height: '180%',
            opacity: 0.08,
            background: 'linear-gradient(0deg, transparent 0%, rgba(103, 58, 183, 0.8) 50%, transparent 100%)',
            transform: 'rotate(-30deg)',
            animation: 'waveFlow 15s ease-in-out alternate infinite',
            '@keyframes waveFlow': {
              '0%': { transform: 'rotate(-30deg) translateY(5%)' },
              '100%': { transform: 'rotate(-30deg) translateY(-5%)' },
            },
          }} />
          
          {/* Flowing Particle System */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
          }}>
            {[...Array(40)].map((_, i) => {
              const size = 2 + Math.random() * 4;
              const duration = 20 + Math.random() * 30;
              const delay = Math.random() * 10;
              const startX = Math.random() * 100;
              const startY = Math.random() * 100;
              const distanceX = 10 + Math.random() * 40;
              const distanceY = 5 + Math.random() * 20;
              const directionX = Math.random() > 0.5 ? 1 : -1;
              const directionY = Math.random() > 0.5 ? 1 : -1;
              
              return (
                <Box key={`particle-${i}`} sx={{
                  position: 'absolute',
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: i % 3 === 0 
                    ? 'radial-gradient(circle, rgba(156, 39, 176, 0.9) 0%, rgba(156, 39, 176, 0.1) 100%)'
                    : i % 3 === 1
                      ? 'radial-gradient(circle, rgba(103, 58, 183, 0.9) 0%, rgba(103, 58, 183, 0.1) 100%)'
                      : 'radial-gradient(circle, rgba(233, 30, 99, 0.9) 0%, rgba(233, 30, 99, 0.1) 100%)',
                  filter: 'blur(1px)',
                  boxShadow: i % 3 === 0
                    ? '0 0 10px rgba(156, 39, 176, 0.8)'
                    : i % 3 === 1
                      ? '0 0 10px rgba(103, 58, 183, 0.8)'
                      : '0 0 10px rgba(233, 30, 99, 0.8)',
                  top: `${startY}%`,
                  left: `${startX}%`,
                  animation: `
                    floatParticleX${i} ${duration}s ease-in-out ${delay}s infinite,
                    floatParticleY${i} ${duration * 1.5}s ease-in-out ${delay}s infinite,
                    pulseParticle 3s ease-in-out infinite alternate
                  `,
                  '@keyframes pulseParticle': {
                    '0%': { opacity: 0.3, transform: 'scale(0.8)' },
                    '100%': { opacity: 0.8, transform: 'scale(1.2)' },
                  },
                  [`@keyframes floatParticleX${i}`]: {
                    '0%, 100%': { 
                      transform: 'translateX(0)',
                      animationTimingFunction: 'cubic-bezier(0.5, 0, 0.5, 1)'
                    },
                    '50%': { 
                      transform: `translateX(${distanceX * directionX}px)`,
                      animationTimingFunction: 'cubic-bezier(0.5, 0, 0.5, 1)'
                    },
                  },
                  [`@keyframes floatParticleY${i}`]: {
                    '0%, 100%': { 
                      transform: 'translateY(0)',
                      animationTimingFunction: 'cubic-bezier(0.5, 0, 0.5, 1)'
                    },
                    '50%': { 
                      transform: `translateY(${distanceY * directionY}px)`,
                      animationTimingFunction: 'cubic-bezier(0.5, 0, 0.5, 1)'
                    },
                  }
                }} />
              );
            })}
          </Box>
          
          {/* Digital data streams */}
          {[...Array(8)].map((_, i) => (
            <Box key={`stream-${i}`} sx={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: '1px',
              height: `${100 + Math.random() * 200}px`,
              background: 'linear-gradient(to bottom, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.8), rgba(156, 39, 176, 0))',
              opacity: 0.4,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `dataStream ${5 + Math.random() * 10}s linear infinite`,
              '@keyframes dataStream': {
                '0%': { opacity: 0, transform: `rotate(${Math.random() * 360}deg) translateY(-100px)` },
                '50%': { opacity: 0.4 },
                '100%': { opacity: 0, transform: `rotate(${Math.random() * 360}deg) translateY(100px)` },
              },
            }} />
          ))}
          
          {/* Holographic hexagon grid */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath fill='%239C27B0' d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100'/%3E%3C/svg%3E")`,
            backgroundSize: '56px 100px',
            animation: 'fadeHexGrid 8s ease-in-out infinite alternate',
            '@keyframes fadeHexGrid': {
              '0%': { opacity: 0.03, backgroundSize: '56px 100px' },
              '100%': { opacity: 0.07, backgroundSize: '60px 105px' },
            },
          }} />
          
          {/* Neural network connection lines */}
          {[...Array(10)].map((_, i) => (
            <Box key={`line-${i}`} sx={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${200 + Math.random() * 400}px`,
              height: '1px',
              background: 'linear-gradient(90deg, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.7), rgba(156, 39, 176, 0))',
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: 0.2,
              animation: `networkLine ${10 + Math.random() * 20}s ease infinite alternate`,
              [`@keyframes networkLine`]: {
                '0%': { opacity: 0.1, width: `${200 + Math.random() * 200}px` },
                '50%': { opacity: 0.3 },
                '100%': { opacity: 0.1, width: `${300 + Math.random() * 200}px` },
              },
            }} />
          ))}
          
          {/* Binary code rain effect */}
          {[...Array(5)].map((_, i) => (
            <Box key={`binary-${i}`} sx={{
              position: 'absolute',
              top: 0,
              left: `${20 * i}%`,
              width: '20%',
              height: '100%',
              fontSize: '12px',
              color: 'rgba(156, 39, 176, 0.15)',
              overflow: 'hidden',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              '&::before': {
                content: '\'10101101110101001010110111010100101011011101010010101101110101001010110111010100\'',
                position: 'absolute',
                top: '-100%',
                animation: `binaryRain ${15 + i * 5}s linear infinite`,
                '@keyframes binaryRain': {
                  '0%': { top: '-100%' },
                  '100%': { top: '100%' },
                },
              }
            }} />
          ))}
          
          {/* Pulsing light sources */}
          <Box sx={{
            position: 'absolute',
            top: '15%',
            left: '25%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(156, 39, 176, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(80px)',
            animation: 'pulseLight 10s ease-in-out infinite alternate',
            '@keyframes pulseLight': {
              '0%': { opacity: 0.03, transform: 'scale(0.8)' },
              '100%': { opacity: 0.08, transform: 'scale(1.2)' },
            },
          }} />
          
          <Box sx={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '35%',
            height: '35%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(103, 58, 183, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(80px)',
            animation: 'pulseLight2 15s ease-in-out infinite alternate',
            '@keyframes pulseLight2': {
              '0%': { opacity: 0.04, transform: 'scale(1)' },
              '100%': { opacity: 0.09, transform: 'scale(1.3)' },
            },
          }} />
          
          {/* Digital glitch effect */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(156, 39, 176, 0.05) 0%, transparent 20%, rgba(103, 58, 183, 0.05) 40%, transparent 60%, rgba(156, 39, 176, 0.05) 80%, transparent 100%)',
            opacity: 0,
            animation: 'glitchEffect 8s ease-in-out infinite',
            '@keyframes glitchEffect': {
              '0%': { opacity: 0, transform: 'translateX(-10px)' },
              '2%': { opacity: 0.3, transform: 'translateX(5px)' },
              '4%': { opacity: 0, transform: 'translateX(-5px)' },
              '6%': { opacity: 0.3, transform: 'translateX(5px)' },
              '8%': { opacity: 0, transform: 'translateX(0)' },
              '100%': { opacity: 0, transform: 'translateX(0)' },
            },
          }} />
          
          {/* Cyberpunk-style scanlines */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(transparent 50%, rgba(16, 16, 36, 0.05) 50%)',
            backgroundSize: '100% 4px',
            zIndex: 2,
            pointerEvents: 'none',
          }} />
        </Box>

        {/* Drawer */}
        <Drawer 
          open={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              boxShadow: '6px 0 24px rgba(0, 0, 0, 0.4)',
            }
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <IconButton 
                edge="start" 
                color="inherit" 
                onClick={() => setIsDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon sx={{ color: '#bb5fce' }} />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#e0e0e0' }}>
                CodeArena
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#bb5fce',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: { xs: 'none', md: 'block' }
              }}>
                Where code battles happen
              </Typography>
              <IconButton color="inherit" onClick={() => navigate("/profile")}>
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'rgba(156, 39, 176, 0.3)',
                  border: '1px solid rgba(156, 39, 176, 0.5)',
                }}>
                  <PersonIcon sx={{ fontSize: 18, color: '#d683e8' }} />
                </Avatar>
              </IconButton>
            </Toolbar>
          </AppBar>

          <Container sx={{ mt: 4 }}>
            {/* Welcome Section with Purple Gradient Text */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ 
                mb: 1, 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #9c27b0 30%, #bb5fce 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                textShadow: '0 0 10px rgba(156, 39, 176, 0.3)'
              }}>
                Welcome back, {username}
              </Typography>
              <Typography variant="body1" color="rgba(224, 224, 224, 0.7)">
                Ready for your next coding challenge?
              </Typography>
            </Box>

            {/* Date and Time */}
            <Paper sx={{ 
              p: 3, 
              mb: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(18, 18, 35, 0.6)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(156, 39, 176, 0.15)',
              '&:hover': {
                borderColor: 'rgba(156, 39, 176, 0.3)',
              }
            }}>
              <Box>
                <Typography variant="caption" color="#bb5fce">Today is</Typography>
                <Typography variant="h6" color="#e0e0e0">{format(currentDate, "EEEE, MMMM do")}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="#bb5fce">Current time</Typography>
                <Typography variant="h6" color="#e0e0e0">{format(currentTime, "h:mm:ss a")}</Typography>
              </Box>
            </Paper>

            {/* Action Cards - Now with 4 cards in a 2x2 grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <CardButton
                  text="Create Class"
                  icon={<CreateIcon />}
                  onClick={() => navigate("/create-workspace")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CardButton
                  text="Join Class"
                  icon={<AddIcon />}
                  onClick={() => navigate("/join-workspace")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CardButton
                  text="View Workspaces"
                  icon={<AssignmentIcon />}
                  onClick={() => navigate("/add-assignment")}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <CardButton
                  text="Export Data"
                  icon={<DescriptionIcon />}
                  onClick={() => navigate("/export-workspace-data")}
                />
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Logout Dialog */}
        <Dialog
          open={isLogoutDialogOpen}
          onClose={() => setIsLogoutDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'rgba(18, 18, 35, 0.95)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, color: '#bb5fce' }}>Confirm Logout</DialogTitle>
          <DialogContent>
            <Typography color="#e0e0e0">Are you sure you want to logout of CodeArena?</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setIsLogoutDialogOpen(false)}
              sx={{ 
                color: '#bb5fce',
                '&:hover': {
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogout}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #E63762 0%, #E64129 100%)',
                }
              }}
            >
              Logout
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default HomeScreen;