import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  List,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { doc, onSnapshot, updateDoc, deleteDoc, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const WorkspaceDetailsScreen = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceMenuAnchorEl, setWorkspaceMenuAnchorEl] = useState(null);
  const [assignmentMenuAnchorEl, setAssignmentMenuAnchorEl] = useState(null);
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteAssignmentDialogOpen, setDeleteAssignmentDialogOpen] = useState(false);
  const [deleteWorkspaceDialogOpen, setDeleteWorkspaceDialogOpen] = useState(false);
  const [deleteAllAssignmentsDialogOpen, setDeleteAllAssignmentsDialogOpen] = useState(false);
  const username = localStorage.getItem("username") || "";

  const handleWorkspaceMenuOpen = (event) => {
    setWorkspaceMenuAnchorEl(event.currentTarget);
  };

  const handleWorkspaceMenuClose = () => {
    setWorkspaceMenuAnchorEl(null);
  };

  const handleAssignmentMenuOpen = (event, index) => {
    event.stopPropagation();
    setAssignmentMenuAnchorEl(event.currentTarget);
    setSelectedAssignmentIndex(index);
  };

  const handleAssignmentMenuClose = () => {
    setAssignmentMenuAnchorEl(null);
  };

  const handleOpenDeleteAssignmentDialog = (event) => {
    event.stopPropagation();
    setDeleteAssignmentDialogOpen(true);
  };

  const handleCloseDeleteAssignmentDialog = () => {
    setDeleteAssignmentDialogOpen(false);
    setSelectedAssignmentIndex(null);
  };

  const handleOpenDeleteWorkspaceDialog = () => {
    setDeleteWorkspaceDialogOpen(true);
    handleWorkspaceMenuClose();
  };

  const handleCloseDeleteWorkspaceDialog = () => {
    setDeleteWorkspaceDialogOpen(false);
  };

  const handleOpenDeleteAllAssignmentsDialog = () => {
    setDeleteAllAssignmentsDialogOpen(true);
    handleWorkspaceMenuClose();
  };

  const handleCloseDeleteAllAssignmentsDialog = () => {
    setDeleteAllAssignmentsDialogOpen(false);
  };

  const handleDeleteAssignment = async () => {
    console.log("handleDeleteAssignment called, selectedAssignmentIndex:", selectedAssignmentIndex);
    if (selectedAssignmentIndex === null) {
      console.log("No assignment selected, exiting");
      setSnackbar({
        open: true,
        message: "No assignment selected",
        severity: "error",
      });
      handleCloseDeleteAssignmentDialog();
      return;
    }
    setIsLoading(true);
    try {
      const assignmentToDelete = assignments[selectedAssignmentIndex];
      console.log("Attempting to delete assignment:", assignmentToDelete);
      const workspaceRef = doc(db, "workspaces", workspaceId);
      await updateDoc(workspaceRef, {
        assignments: arrayRemove(assignmentToDelete),
      });
      console.log("Assignment deleted successfully");
      setSnackbar({
        open: true,
        message: "Assignment deleted successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Delete assignment error:", error);
      setSnackbar({
        open: true,
        message: `Failed to delete assignment: ${error.message || "Unknown error"}`,
        severity: "error",
      });
    } finally {
      setIsLoading(false);
      handleCloseDeleteAssignmentDialog();
    }
  };

  const handleDeleteAllAssignments = async () => {
    setIsLoading(true);
    try {
      if (assignments.length === 0) {
        console.log("No assignments to delete");
        setSnackbar({
          open: true,
          message: "No assignments to delete",
          severity: "info",
        });
        handleCloseDeleteAllAssignmentsDialog();
        return;
      }
      const workspaceRef = doc(db, "workspaces", workspaceId);
      await updateDoc(workspaceRef, {
        assignments: [],
      });
      console.log("All assignments deleted successfully");
      setSnackbar({
        open: true,
        message: "All assignments deleted successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Delete all assignments error:", error);
      setSnackbar({
        open: true,
        message: `Failed to delete all assignments: ${error.message || "Unknown error"}`,
        severity: "error",
      });
    } finally {
      setIsLoading(false);
      handleCloseDeleteAllAssignmentsDialog();
    }
  };

  const handleDeleteWorkspace = async () => {
    setIsLoading(true);
    try {
      const workspaceRef = doc(db, "workspaces", workspaceId);
      await deleteDoc(workspaceRef);
      setSnackbar({
        open: true,
        message: "Workspace deleted successfully!",
        severity: "success",
      });
      navigate("/add-assignment");
    } catch (error) {
      console.error("Delete workspace error:", error);
      setSnackbar({
        open: true,
        message: `Failed to delete workspace: ${error.message || "Unknown error"}`,
        severity: "error",
      });
    }
    setIsLoading(false);
    handleCloseDeleteWorkspaceDialog();
  };

  const handleUnenroll = async () => {
    setIsLoading(true);
    try {
      const workspaceRef = doc(db, "workspaces", workspaceId);
      if (!workspace?.users?.includes(username)) {
        throw new Error("You are not enrolled in this workspace");
      }
      await updateDoc(workspaceRef, {
        users: arrayRemove(username),
      });
      setSnackbar({
        open: true,
        message: "You have unenrolled from the workspace!",
        severity: "success",
      });
      navigate("/add-assignment");
    } catch (error) {
      console.error("Unenroll error:", error);
      setSnackbar({
        open: true,
        message: `Failed to unenroll: ${error.message || "Unknown error"}`,
        severity: "error",
      });
    }
    setIsLoading(false);
    handleWorkspaceMenuClose();
  };

  const getWorkspaceTitle = (workspace) => {
    return workspace?.title || `Workspace_${workspaceId.substring(0, 6)}`;
  };

  const copyWorkspaceId = () => {
    navigator.clipboard.writeText(workspaceId);
    setSnackbar({
      open: true,
      message: "Workspace ID copied to clipboard!",
      severity: "success",
    });
  };

  useEffect(() => {
    if (!workspaceId || !username) {
      setSnackbar({
        open: true,
        message: "Missing workspace ID or username",
        severity: "error",
      });
      navigate("/add-assignment");
      return;
    }

    const workspaceRef = doc(db, "workspaces", workspaceId);
    const unsubscribe = onSnapshot(
      workspaceRef,
      (document) => {
        if (document.exists()) {
          const data = document.data();
          setWorkspace({ id: document.id, ...data });
          setIsCreator(data.creator === username);
          const assignmentsList = data.assignments || [];
          const sortedAssignments = [...assignmentsList].sort((a, b) => 
            (b.postedAt || 0) - (a.postedAt || 0)
          );
          setAssignments(sortedAssignments);
          setFilteredAssignments(sortedAssignments);
        } else {
          console.error("Workspace not found");
          setSnackbar({
            open: true,
            message: "Workspace not found",
            severity: "error",
          });
          navigate("/add-assignment");
        }
      },
      (error) => {
        console.error("Error fetching workspace:", error);
        setSnackbar({
          open: true,
          message: `Error fetching workspace: ${error.message || "Unknown error"}`,
          severity: "error",
        });
        navigate("/add-assignment");
      }
    );

    return () => unsubscribe();
  }, [workspaceId, username, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAssignments(assignments);
    } else {
      const filtered = assignments.filter(assignment => 
        assignment.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAssignments(filtered);
    }
  }, [searchQuery, assignments]);

  const handleCreateAssignment = () => {
    navigate(`/workspace/${workspaceId}/create-assignment`);
  };

  const handleAssignmentClick = (assignment) => {
    if (assignmentMenuAnchorEl || deleteAssignmentDialogOpen) return;
    const currentTime = new Date().getTime();
    const activationTime = assignment.activationDate || 0;
    const closingTime = assignment.closingDate || Infinity;

    if (!isCreator) {
      if (currentTime < activationTime) {
        setSnackbar({
          open: true,
          message: "This assignment hasn't started yet!",
          severity: "warning",
        });
        return;
      }

      if (currentTime > closingTime) {
        setSnackbar({
          open: true,
          message: "This assignment is already closed!",
          severity: "error",
        });
        return;
      }
    }

    if (isCreator) {
      navigate(`/workspace/${workspaceId}/fetch-submissions/${assignment.postedAt}`);
    } else {
      navigate(`/workspace/${workspaceId}/submit/${assignment.postedAt}`);
    }
  };

  const isAssignmentActivated = (activationDate) => {
    if (!activationDate) return true;
    const currentTime = new Date().getTime();
    return currentTime >= activationDate;
  };

  const isAssignmentClosed = (closingDate) => {
    if (!closingDate) return false;
    const currentTime = new Date().getTime();
    return currentTime >= closingDate;
  };

  const getAssignmentStatus = (assignment) => {
    if (!isAssignmentActivated(assignment.activationDate)) {
      return { label: "Upcoming", color: "#ff9800", bgColor: "rgba(255, 152, 0, 0.1)" };
    } else if (isAssignmentClosed(assignment.closingDate)) {
      return { label: "Closed", color: "#f44336", bgColor: "rgba(244, 67, 54, 0.1)" };
    } else {
      return { label: "Active", color: "#4caf50", bgColor: "rgba(76, 175, 80, 0.1)" };
    }
  };

  const handleGoBack = () => {
    navigate("/add-assignment");
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const renderContent = () => {
    if (!workspace) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(18, 18, 35, 0.6)',
          borderRadius: 3,
          border: '1px solid rgba(156, 39, 176, 0.15)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)'
        }}>
          <Typography variant="body1" sx={{ color: 'rgba(224, 224, 224, 0.8)' }}>
            Loading workspace details...
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <Box sx={{ 
          backgroundColor: 'rgba(18, 18, 35, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: 3,
          borderRadius: 3,
          border: '1px solid rgba(156, 39, 176, 0.15)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(156, 39, 176, 0.2) inset',
          mb: 4,
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
          <Typography variant="h5" sx={{ 
            color: '#e0e0e0',
            fontWeight: 'bold',
            mb: 2,
            textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '1px'
          }}>
            {getWorkspaceTitle(workspace)}
          </Typography>
          
          {isCreator && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 2,
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              borderRadius: '4px',
              padding: '8px 12px',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              width: 'fit-content'
            }}>
              <Typography variant="caption" sx={{ 
                color: 'rgba(224, 224, 224, 0.7)',
                mr: 1,
                fontWeight: 'bold'
              }}>
                Workspace ID:
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#bb5fce',
                fontFamily: 'monospace',
                mr: 1
              }}>
                {workspaceId}
              </Typography>
              <IconButton 
                size="small" 
                onClick={copyWorkspaceId}
                disabled={isLoading}
                sx={{
                  color: 'rgba(224, 224, 224, 0.7)',
                  '&:hover': {
                    color: '#9c27b0',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(224, 224, 224, 0.3)',
                  },
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          <Box sx={{ 
            width: '50%',
            height: '2px',
            mb: 3,
            background: 'linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.6), rgba(156, 39, 176, 0))',
            borderRadius: '2px',
          }} />
          
          <Typography variant="body1" sx={{ 
            mb: 2, 
            color: 'rgba(224, 224, 224, 0.8)', 
            display: 'flex', 
            alignItems: 'center'
          }}>
            Creator: <span style={{ fontWeight: 'bold', marginLeft: '8px', color: '#ba68c8' }}>{workspace.creator}</span>
          </Typography>

          {isCreator && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateAssignment}
              disabled={isLoading}
              sx={{
                mt: 2,
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
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: "bold",
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
              Create Assignment
            </Button>
          )}
        </Box>

        <Box sx={{ 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ 
              color: '#9c27b0', 
              fontSize: '28px', 
              mr: 1,
              filter: 'drop-shadow(0 0 5px rgba(156, 39, 176, 0.5))'
            }} />
            <Typography variant="h5" sx={{ 
              color: '#e0e0e0',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: '1px'
            }}>
              Assignments
            </Typography>
          </Box>
          
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={isLoading}
            sx={{
              width: '300px',
              '& .MuiOutlinedInput-root': {
                color: '#e0e0e0',
                '& fieldset': {
                  borderColor: 'rgba(156, 39, 176, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(156, 39, 176, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(156, 39, 176, 0.7)',
                },
                '&.Mui-disabled fieldset': {
                  borderColor: 'rgba(156, 39, 176, 0.1)',
                },
              },
              '& .MuiInputBase-input': {
                py: 1,
              },
              backgroundColor: 'rgba(18, 18, 35, 0.4)',
              borderRadius: '4px',
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(224, 224, 224, 0.7)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredAssignments.length === 0 ? (
          <Box sx={{ 
            backgroundColor: 'rgba(18, 18, 35, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: 3,
            borderRadius: 3,
            border: '1px solid rgba(156, 39, 176, 0.15)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150px'
          }}>
            <Typography variant="body1" sx={{ 
              fontStyle: "italic", 
              color: 'rgba(224, 224, 224, 0.6)'
            }}>
              {searchQuery ? "No matching assignments found" : "No assignments uploaded yet."}
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', padding: 0 }}>
            {filteredAssignments.map((assignment, index) => {
              const status = getAssignmentStatus(assignment);
              
              return (
                <Card
                  key={index}
                  sx={{
                    mb: 3,
                    backgroundColor: 'rgba(18, 18, 35, 0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    border: '1px solid rgba(156, 39, 176, 0.15)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    "&:hover": {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35), 0 0 15px rgba(156, 39, 176, 0.3) inset',
                      '&::before': {
                        width: '100%',
                        opacity: 0.2,
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '0%',
                      height: '100%',
                      background: 'linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.3))',
                      opacity: 0,
                      transition: 'all 0.6s ease',
                      zIndex: 0,
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }} onClick={() => handleAssignmentClick(assignment)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h5" sx={{ 
                        mb: 2, 
                        fontWeight: "bold", 
                        color: '#e0e0e0',
                        textShadow: '0 0 10px rgba(156, 39, 176, 0.2)',
                      }}>
                        {assignment.title || "Untitled Assignment"}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          display: 'inline-block',
                          py: 0.5,
                          px: 1.5,
                          borderRadius: '12px',
                          backgroundColor: status.bgColor,
                          border: `1px solid ${status.color}`,
                          mr: isCreator ? 1 : 0,
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: status.color,
                            fontWeight: 'bold',
                          }}>
                            {status.label}
                          </Typography>
                        </Box>
                        {isCreator && (
                          <>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignmentMenuOpen(e, index);
                              }}
                              disabled={isLoading}
                              sx={{
                                color: 'rgba(224, 224, 224, 0.7)',
                                '&:hover': {
                                  color: '#9c27b0',
                                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                },
                                '&.Mui-disabled': {
                                  color: 'rgba(224, 224, 224, 0.3)',
                                },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                            <Menu
                              anchorEl={assignmentMenuAnchorEl}
                              open={Boolean(assignmentMenuAnchorEl) && selectedAssignmentIndex === index}
                              onClose={handleAssignmentMenuClose}
                              PaperProps={{
                                sx: {
                                  backgroundColor: 'rgba(18, 18, 35, 0.9)',
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(156, 39, 176, 0.3)',
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                                  color: '#e0e0e0',
                                  minWidth: '150px',
                                },
                              }}
                            >
                              <MenuItem
                                onClick={(e) => handleOpenDeleteAssignmentDialog(e)}
                                sx={{
                                  py: 1,
                                  '&:hover': {
                                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                                  },
                                }}
                              >
                                Delete Assignment
                              </MenuItem>
                            </Menu>
                          </>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ 
                      width: '100%',
                      height: '1px',
                      mb: 2,
                      background: 'linear-gradient(to right, rgba(156, 39, 176, 0), rgba(156, 39, 176, 0.3), rgba(156, 39, 176, 0))',
                    }} />
                    {assignment.description && (
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(224, 224, 224, 0.7)', 
                        mb: 2,
                        fontStyle: 'italic'
                      }}>
                        {assignment.description}
                      </Typography>
                    )}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(156, 39, 176, 0.7)' }}>
                          Posted
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(224, 224, 224, 0.7)' }}>
                          {new Date(assignment.postedAt).toLocaleString()}
                        </Typography>
                      </Box>
                      {assignment.activationDate && (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(156, 39, 176, 0.7)' }}>
                            Activation
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(224, 224, 224, 0.7)' }}>
                            {new Date(assignment.activationDate).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      {assignment.closingDate && (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(156, 39, 176, 0.7)' }}>
                            Deadline
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(224, 224, 224, 0.7)' }}>
                            {new Date(assignment.closingDate).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      {!isCreator ? (
                        <Button
                          variant="contained"
                          disabled={
                            !isAssignmentActivated(assignment.activationDate) ||
                            isAssignmentClosed(assignment.closingDate) ||
                            isLoading
                          }
                          sx={{
                            backgroundColor: "#9c27b0",
                            backgroundImage: 'linear-gradient(135deg, #9c27b0 0%, #7B1FA2 100%)',
                            "&:hover": { 
                              backgroundColor: "#7B1FA2",
                              boxShadow: '0 0 15px rgba(156, 39, 176, 0.5)',
                            },
                            "&:disabled": {
                              backgroundColor: "rgba(80, 80, 80, 0.3)",
                              color: 'rgba(224, 224, 224, 0.4)',
                            },
                            borderRadius: "6px",
                            textTransform: "none",
                            fontWeight: "bold",
                            letterSpacing: '0.5px',
                            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                            transition: 'all 0.3s ease-in-out',
                          }}
                        >
                          {!isAssignmentActivated(assignment.activationDate) ? "Not Started" : 
                           isAssignmentClosed(assignment.closingDate) ? "Closed" : "Start Assignment"}
                        </Button>
                      ) : (
                        <Typography variant="body2" sx={{ 
                          fontStyle: "italic", 
                          color: 'rgba(224, 224, 224, 0.6)',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Box component="span" sx={{ 
                            height: '6px', 
                            width: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: '#9c27b0', 
                            display: 'inline-block',
                            mr: 1,
                            boxShadow: '0 0 5px rgba(156, 39, 176, 0.7)',
                          }}></Box>
                          Tap to view submissions
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </List>
        )}
      </>
    );
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
      overflow: 'auto',
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
    }}>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          linear-gradient(135deg, rgba(10, 10, 24, 0.8) 0%, rgba(18, 18, 35, 0.9) 100%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h30v30H0V0zm30 30h30v30H30V30z' fill='%239C27B0' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")
        `,
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          linear-gradient(90deg, rgba(156, 39, 176, 0) 0%, rgba(156, 39, 176, 0.1) 50%, rgba(156, 39, 176, 0) 100%),
          linear-gradient(rgba(156, 39, 176, 0) 0%, rgba(156, 39, 176, 0.1) 50%, rgba(156, 39, 176, 0) 100%)
        `,
        backgroundSize: '40px 40px',
        animation: 'circuitMove 20s linear infinite',
        '@keyframes circuitMove': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '1000px 1000px' },
        },
        zIndex: 1,
      }} />
      <Box sx={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(156, 39, 176, 0.8) 0%, rgba(156, 39, 176, 0) 70%)',
        boxShadow: '0 0 15px rgba(156, 39, 176, 0.6)',
        animation: 'pulse 4s ease-in-out infinite',
        '@keyframes pulse': {
          '0%': { transform: 'scale(1)', opacity: 0.8 },
          '50%': { transform: 'scale(1.5)', opacity: 0.4 },
          '100%': { transform: 'scale(1)', opacity: 0.8 },
        },
        zIndex: 2,
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '25%',
        right: '20%',
        width: '15px',
        height: '15px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 50, 200, 0.8) 0%, rgba(100, 50, 200, 0) 70%)',
        boxShadow: '0 0 20px rgba(100, 50, 200, 0.6)',
        animation: 'pulse 3s ease-in-out infinite 1s',
        zIndex: 2,
      }} />
      <Box sx={{
        position: 'absolute',
        top: '40%',
        right: '30%',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0) 70%)',
        boxShadow: '0 0 10px rgba(76, 175, 80, 0.6)',
        animation: 'pulse 5s ease-in-out infinite 0.5s',
        zIndex: 2,
      }} />
      <AppBar position="static" sx={{ 
        background: 'rgba(10, 10, 24, 0.8)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(156, 39, 176, 0.1) inset',
        borderBottom: '1px solid rgba(156, 39, 176, 0.2)',
        position: 'relative',
        zIndex: 5,
      }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={handleGoBack}
            disabled={isLoading}
            sx={{ 
              mr: 2,
              color: 'rgba(224, 224, 224, 0.7)',
              '&:hover': {
                color: '#9c27b0',
                transform: 'translateX(-3px)',
              },
              '&.Mui-disabled': {
                color: 'rgba(224, 224, 224, 0.3)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ 
            flexGrow: 1,
            fontWeight: "bold",
            letterSpacing: '1.5px',
            textShadow: '0 0 10px rgba(156, 39, 176, 0.3)',
            fontFamily: "'Orbitron', sans-serif",
            color: '#e0e0e0',
          }}>
            <span style={{ 
              background: 'linear-gradient(to right, #9c27b0, #ba68c8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Code</span>
            <span>Arena</span> Workspace
          </Typography>
          {workspace && (
            <>
              <IconButton
                color="inherit"
                onClick={handleWorkspaceMenuOpen}
                disabled={isLoading}
                sx={{
                  color: 'rgba(224, 224, 224, 0.7)',
                  '&:hover': {
                    color: '#9c27b0',
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(224, 224, 224, 0.3)',
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={workspaceMenuAnchorEl}
                open={Boolean(workspaceMenuAnchorEl)}
                onClose={handleWorkspaceMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: 'rgba(18, 18, 35, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(156, 39, 176, 0.3)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    color: '#e0e0e0',
                    minWidth: '180px',
                  },
                }}
              >
                {!isCreator && (
                  <MenuItem
                    onClick={handleUnenroll}
                    disabled={isLoading}
                    sx={{
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(224, 224, 224, 0.3)',
                      },
                    }}
                  >
                    Unenroll
                  </MenuItem>
                )}
                {isCreator && (
                  <MenuItem
                    onClick={handleOpenDeleteWorkspaceDialog}
                    disabled={isLoading}
                    sx={{
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(224, 224, 224, 0.3)',
                      },
                    }}
                  >
                    Delete Workspace
                  </MenuItem>
                )}
                {isCreator && (
                  <MenuItem
                    onClick={handleOpenDeleteAllAssignmentsDialog}
                    disabled={isLoading}
                    sx={{
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(224, 224, 224, 0.3)',
                      },
                    }}
                  >
                    Delete All Assignments
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container sx={{ 
        flex: 1,
        position: 'relative',
        zIndex: 2,
        overflow: 'auto',
        py: 4,
      }}>
        {isLoading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(18, 18, 35, 0.7)',
            zIndex: 10,
          }}>
            <CircularProgress sx={{ color: '#9c27b0' }} />
          </Box>
        )}
        {renderContent()}
      </Container>

      <Dialog
        open={deleteAssignmentDialogOpen}
        onClose={handleCloseDeleteAssignmentDialog}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(18, 18, 35, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: '#e0e0e0',
            borderRadius: '8px',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 5px rgba(156, 39, 176, 0.3)' }}>
          Delete Assignment
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(224, 224, 224, 0.8)' }}>
            Are you sure you want to delete this assignment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteAssignmentDialog}
            sx={{
              color: 'rgba(224, 224, 224, 0.7)',
              textTransform: 'none',
              '&:hover': {
                color: '#9c27b0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log("Delete button clicked");
              handleDeleteAssignment();
            }}
            disabled={isLoading}
            sx={{
              backgroundColor: '#9c27b0',
              color: '#e0e0e0',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#7B1FA2',
                boxShadow: '0 0 10px rgba(156, 39, 176, 0.5)',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(156, 39, 176, 0.3)',
                color: 'rgba(224, 224, 224, 0.4)',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteWorkspaceDialogOpen}
        onClose={handleCloseDeleteWorkspaceDialog}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(18, 18, 35, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: '#e0e0e0',
            borderRadius: '8px',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 5px rgba(156, 39, 176, 0.3)' }}>
          Delete Workspace
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(224, 224, 224, 0.8)' }}>
            Are you sure you want to delete this workspace? All assignments and data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteWorkspaceDialog}
            sx={{
              color: 'rgba(224, 224, 224, 0.7)',
              textTransform: 'none',
              '&:hover': {
                color: '#9c27b0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteWorkspace}
            disabled={isLoading}
            sx={{
              backgroundColor: '#9c27b0',
              color: '#e0e0e0',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#7B1FA2',
                boxShadow: '0 0 10px rgba(156, 39, 176, 0.5)',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(156, 39, 176, 0.3)',
                color: 'rgba(224, 224, 224, 0.4)',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteAllAssignmentsDialogOpen}
        onClose={handleCloseDeleteAllAssignmentsDialog}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(18, 18, 35, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: '#e0e0e0',
            borderRadius: '8px',
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 5px rgba(156, 39, 176, 0.3)' }}>
          Delete All Assignments
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(224, 224, 224, 0.8)' }}>
            Are you sure you want to delete all assignments in this workspace? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteAllAssignmentsDialog}
            sx={{
              color: 'rgba(224, 224, 224, 0.7)',
              textTransform: 'none',
              '&:hover': {
                color: '#9c27b0',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log("Delete all assignments button clicked");
              handleDeleteAllAssignments();
            }}
            disabled={isLoading}
            sx={{
              backgroundColor: '#9c27b0',
              color: '#e0e0e0',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#7B1FA2',
                boxShadow: '0 0 10px rgba(156, 39, 176, 0.5)',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(156, 39, 176, 0.3)',
                color: 'rgba(224, 224, 224, 0.4)',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ 
            width: '100%', 
            backdropFilter: 'blur(10px)', 
            backgroundColor: 'rgba(18, 18, 35, 0.8)',
            color: '#e0e0e0',
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'success' ? '#4caf50' : 
                    snackbar.severity === 'error' ? '#f44336' : 
                    snackbar.severity === 'warning' ? '#ff9800' : 
                    snackbar.severity === 'info' ? '#2196f3' : '#9c27b0',
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkspaceDetailsScreen;