import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TourDetails from './pages/TourDetails';
import EventPage from './pages/EventPage';
import ParticipantsPage from './pages/ParticipantsPage';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tour/:tourId" element={<TourDetails />} />
        <Route path="/event/:tourId/:eventId" element={<EventPage />} />
        <Route path="/tour/:tourId/participants" element={<ParticipantsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
