import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const WorkspaceItem = ({ workspace }) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{ mb: 2, cursor: "pointer" }}
      onClick={() => navigate(`/workspace/${workspace.id}`)} // Navigate to the workspace detail screen
    >
      <CardContent>
        <Typography variant="h6">Workspace ID: {workspace.id}</Typography>
        <Typography variant="body2" color="textSecondary">
          Creator: {workspace.creator}
        </Typography>
        {workspace.creator === localStorage.getItem("username") && (
          <Typography variant="body2" color="primary" sx={{ fontStyle: "italic" }}>
            (You are the creator)
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkspaceItem;