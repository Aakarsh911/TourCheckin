import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();

  // Sample functions to navigate to different sections
  const handleCreateTour = () => {
    navigate('/create-tour');
  };

  const handleViewTours = () => {
    navigate('/tours');
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard-buttons">
        <button onClick={handleCreateTour}>Create New Tour</button>
        <button onClick={handleViewTours}>View My Tours</button>
      </div>
      <div className="dashboard-footer">
        <p>Tour Check-In App</p>
      </div>
    </div>
  );
}

export default Dashboard;
