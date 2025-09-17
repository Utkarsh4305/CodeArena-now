import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginScreen from "./components/LoginScreen";
import CreateScreen from "./components/CreateScreen";
import HomeScreen from "./components/HomeScreen";
import CreateWorkspaceScreen from "./components/CreateWorkspaceScreen";
import JoinWorkspaceScreen from "./components/JoinWorkspaceScreen";
import AddAssignmentScreen from "./components/AddAssignmentScreen";
import WorkspaceDetailsScreen from "./components/WorkspaceDetailsScreen";
import SubmissionScreen from "./components/SubmissionScreen";
import CreateAssignmentScreen from "./components/CreateAssignmentScreen";
import FetchSubmissionsScreen from "./components/FetchSubmissionsScreen";
import ExportWorkspaceDataScreen from "./components/ExportScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/create" element={<CreateScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/create-workspace" element={<CreateWorkspaceScreen />} />
        <Route path="/join-workspace" element={<JoinWorkspaceScreen />} />
        <Route path="/add-assignment" element={<AddAssignmentScreen />} />
        <Route path="/workspace/:workspaceId" element={<WorkspaceDetailsScreen />} />
        <Route
          path="/workspace/:workspaceId/create-assignment"
          element={<CreateAssignmentScreen />}
        />
        <Route
          path="/workspace/:workspaceId/fetch-submissions/:assignmentId"
          element={<FetchSubmissionsScreen />}
        />
        <Route
          path="/workspace/:workspaceId/submit/:assignmentId"
          element={<SubmissionScreen />}
        />
        <Route
          path="/submission/:workspaceId/:assignmentId"
          element={<SubmissionScreen />}
        />
        <Route
          path="/export-workspace-data"
          element={<ExportWorkspaceDataScreen />}
        />
      </Routes>
    </Router>
  );
}

export default App;