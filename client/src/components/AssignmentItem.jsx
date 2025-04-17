import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

const AssignmentItem = ({ assignment, navigate, workspaceId }) => {
  const postedAt = assignment.postedAt || 0;
  const questions = assignment.questions || [];

  return (
    <Card
      sx={{ mb: 2, cursor: "pointer" }}
      onClick={() => navigate(`/submission/${workspaceId}/${postedAt}`)}
    >
      <CardContent>
        <Typography variant="h6">Assignment posted at: {new Date(postedAt).toLocaleString()}</Typography>
        <Box sx={{ mt: 1 }}>
          {questions.map((question, index) => (
            <Typography key={index} variant="body2">
              - {question}
            </Typography>
          ))}
        </Box>
        <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
          Tap to submit assignment
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AssignmentItem;