import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Container,
  List,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from "@mui/material";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';

const AddAssignmentScreen = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const username = localStorage.getItem("username") || "";

  useEffect(() => {
    const fetchUserWorkspaces = async () => {
      try {
        const workspacesList = [];
        const creatorQuery = query(collection(db, "workspaces"), where("creator", "==", username));
        const creatorDocs = await getDocs(creatorQuery);
        creatorDocs.forEach((doc) => workspacesList.push({ id: doc.id, ...doc.data() }));

        const memberQuery = query(collection(db, "workspaces"), where("users", "array-contains", username));
        const memberDocs = await getDocs(memberQuery);
        memberDocs.forEach((doc) => workspacesList.push({ id: doc.id, ...doc.data() }));

        setWorkspaces(workspacesList);
        setFilteredWorkspaces(workspacesList);
      } catch (e) {
        setError(`Error fetching workspaces: ${e.message}`);
      }
    };

    fetchUserWorkspaces();
  }, [username]);

  // Filter workspaces based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredWorkspaces(workspaces);
    } else {
      const filtered = workspaces.filter((workspace) => {
        const title = getWorkspaceTitle(workspace).toLowerCase();
        const description = (workspace.description || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return title.includes(query) || description.includes(query);
      });
      setFilteredWorkspaces(filtered);
    }
  }, [searchQuery, workspaces]);

  // Function to display workspace title or fallback
  const getWorkspaceTitle = (workspace) => {
    return workspace.title || `Workspace_${workspace.id.substring(0, 6)}`;
  };

  return (
    <Box sx={{ 
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
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
      <AppBar position="static" sx={{ 
        background: 'rgba(18, 18, 35, 0.8)', 
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), 0 0 5px rgba(156, 39, 176, 0.1)',
        borderBottom: '1px solid rgba(156, 39, 176, 0.15)',
        position: 'relative',
        zIndex: 2,
      }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={() => navigate('/home')}
              sx={{ 
                mr: 2, 
                color: 'rgba(224, 224, 224, 0.8)',
                '&:hover': {
                  color: '#9c27b0',
                  background: 'rgba(156, 39, 176, 0.1)',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(to right, #e0e0e0, #9c27b0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '1px',
                textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
              }}
            >
              CodeArena
            </Typography>
          </Box>
          
          <Box>
            <Button 
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-workspace')}
              sx={{
                background: 'linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                px: 2,
                textTransform: 'none',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 5px rgba(156, 39, 176, 0.3) inset',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ab47bc 0%, #8E24AA 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3), 0 0 5px rgba(156, 39, 176, 0.4) inset',
                }
              }}
            >
              New Workspace
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ 
        mt: 4, 
        mb: 4, 
        position: 'relative', 
        zIndex: 2,
        height: 'calc(100vh - 128px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{ 
          p: 3, 
          background: 'rgba(18, 18, 35, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          border: '1px solid rgba(156, 39, 176, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), 0 0 10px rgba(156, 39, 176, 0.1) inset',
          position: 'relative',
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.3), rgba(156, 39, 176, 0))',
          },
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(18, 18, 35, 0.2)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(156, 39, 176, 0.5)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(156, 39, 176, 0.7)',
            }
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
          }}>
            <Typography variant="h5" sx={{ 
              fontFamily: "'Orbitron', sans-serif",
              color: '#e0e0e0',
              letterSpacing: '1px',
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-8px',
                left: '0',
                width: '80px',
                height: '2px',
                background: 'linear-gradient(to right, #9c27b0, rgba(156, 39, 176, 0))',
                borderRadius: '1px',
                boxShadow: '0 0 8px rgba(156, 39, 176, 0.5)',
              }
            }}>
              Your CodeArena Workspaces
            </Typography>

            {/* Search Bar */}
            <TextField
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(156, 39, 176, 0.7)' }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'rgba(25, 25, 45, 0.6)',
                  borderRadius: '20px',
                  color: '#e0e0e0',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 39, 176, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 39, 176, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#9c27b0',
                  },
                  '& .MuiInputAdornment-root': {
                    color: 'rgba(156, 39, 176, 0.7)',
                  },
                  width: '250px',
                }
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: 'rgba(224, 224, 224, 0.7)',
                },
              }}
            />
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                backgroundColor: 'rgba(50, 10, 10, 0.8)', 
                color: '#ff8f8f',
                borderRadius: '6px',
                border: '1px solid rgba(255, 70, 70, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(18, 18, 35, 0.2)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(156, 39, 176, 0.5)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(156, 39, 176, 0.7)',
              }
            }
          }}>
            {filteredWorkspaces.length === 0 ? (
              <Box sx={{ 
                p: 4,
                textAlign: 'center',
                borderRadius: '8px',
                background: 'rgba(25, 25, 45, 0.4)',
                border: '1px dashed rgba(156, 39, 176, 0.2)',
              }}>
                <Typography variant="body1" sx={{ 
                  fontStyle: "italic",
                  color: 'rgba(224, 224, 224, 0.7)',
                }}>
                  {workspaces.length === 0 
                    ? "No workspaces found. Create your first workspace to get started!" 
                    : "No workspaces match your search query."}
                </Typography>
                {workspaces.length === 0 && (
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-workspace')}
                    sx={{ 
                      mt: 2,
                      borderColor: 'rgba(156, 39, 176, 0.5)',
                      color: '#bb5fce',
                      borderRadius: '20px',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#9c27b0',
                        background: 'rgba(156, 39, 176, 0.1)',
                      }
                    }}
                  >
                    Create Workspace
                  </Button>
                )}
                {workspaces.length > 0 && (
                  <Button 
                    variant="outlined" 
                    onClick={() => setSearchQuery("")}
                    sx={{ 
                      mt: 2,
                      borderColor: 'rgba(156, 39, 176, 0.5)',
                      color: '#bb5fce',
                      borderRadius: '20px',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#9c27b0',
                        background: 'rgba(156, 39, 176, 0.1)',
                      }
                    }}
                  >
                    Clear Search
                  </Button>
                )}
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredWorkspaces.map((workspace) => (
                  <Card
                    key={workspace.id}
                    sx={{ 
                      mb: 2, 
                      cursor: "pointer",
                      background: 'rgba(25, 25, 45, 0.6)',
                      borderRadius: '8px',
                      border: '1px solid rgba(156, 39, 176, 0.1)',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      position: 'relative',
                      '&:hover': { 
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(156, 39, 176, 0.2)',
                        '& .hover-glow': {
                          opacity: 1,
                        }
                      },
                    }}
                    onClick={() => navigate(`/workspace/${workspace.id}`)}
                  >
                    <Box 
                      className="hover-glow"
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at center, rgba(156, 39, 176, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}
                    />
                    
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" sx={{ 
                            color: '#e0e0e0',
                            fontFamily: "'Orbitron', sans-serif",
                            letterSpacing: '0.5px',
                          }}>
                            {getWorkspaceTitle(workspace)}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <PersonIcon sx={{ fontSize: '0.9rem', color: 'rgba(224, 224, 224, 0.6)', mr: 0.5 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(224, 224, 224, 0.6)' }}>
                              Creator: <span style={{ color: '#bb5fce' }}>{workspace.creator}</span>
                            </Typography>
                          </Box>
                          
                          {workspace.creator === username && (
                            <Typography variant="body2" sx={{ 
                              color: '#9c27b0', 
                              fontStyle: "italic",
                              mt: 0.5,
                            }}>
                              (You are the creator)
                            </Typography>
                          )}
                          
                          {workspace.users && workspace.users.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <GroupIcon sx={{ fontSize: '0.9rem', color: 'rgba(224, 224, 224, 0.6)', mr: 0.5 }} />
                              <Typography variant="body2" sx={{ color: 'rgba(224, 224, 224, 0.6)' }}>
                                {workspace.users.length} team member{workspace.users.length > 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ 
                          px: 2, 
                          py: 0.5, 
                          borderRadius: '12px', 
                          background: 'rgba(156, 39, 176, 0.15)',
                          border: '1px solid rgba(156, 39, 176, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: '#4caf50',
                            boxShadow: '0 0 5px rgba(76, 175, 80, 0.6)',
                            mr: 1 
                          }} />
                          <Typography variant="caption" sx={{ color: 'rgba(224, 224, 224, 0.8)' }}>
                            Active
                          </Typography>
                        </Box>
                      </Box>
                      
                      {workspace.description && (
                        <Typography variant="body2" sx={{ 
                          color: 'rgba(224, 224, 224, 0.7)', 
                          mt: 1.5,
                          fontStyle: 'italic'
                        }}>
                          {workspace.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          size="small"
                          sx={{
                            color: '#bb5fce',
                            background: 'rgba(156, 39, 176, 0.1)',
                            border: '1px solid rgba(156, 39, 176, 0.2)',
                            borderRadius: '16px',
                            textTransform: 'none',
                            px: 2,
                            py: 0.5,
                            '&:hover': {
                              background: 'rgba(156, 39, 176, 0.2)',
                              borderColor: 'rgba(156, 39, 176, 0.3)',
                            }
                          }}
                        >
                          Enter Workspace
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AddAssignmentScreen;