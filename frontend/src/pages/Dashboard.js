import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddTourModal from '../components/AddTourModal';
import EditTourModal from '../components/EditTourModal';
import '../css/Dashboard.css';
import { Link } from 'react-router-dom';
import { FaEllipsisV } from 'react-icons/fa'; // Import icon for dropdown menu
import { FaListOl } from 'react-icons/fa';

function Dashboard() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null); // Store selected tour for editing
  const [activeDropdown, setActiveDropdown] = useState(null); // Manage active dropdowns
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://tourcheckin.onrender.com/api/tour/my-tours', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setTours(data);
      } catch (error) {
        console.error('Error fetching tours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const handleCreateTour = async (tourData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://tourcheckin.onrender.com/api/tour/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tourData),
      });

      const result = await response.json();

      if (response.ok) {
        setTours((prevTours) => [...prevTours, result.tour]);
      } else {
        alert(result.message || 'Failed to create tour');
      }
    } catch (error) {
      console.error('Error creating tour:', error);
    } finally {
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteTour = async (tourId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTours((prevTours) => prevTours.filter((tour) => tour._id !== tourId));
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to delete tour');
      }
    } catch (error) {
      console.error('Error deleting tour:', error);
    }
  };

  const handleEditTour = (tour) => {
    setSelectedTour(tour);
    setIsEditModalOpen(true);
  };

  const handleSaveTour = async (updatedTourData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${selectedTour._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTourData),
      });

      if (response.ok) {
        const updatedTour = await response.json();
        setTours((prevTours) =>
          prevTours.map((tour) => (tour._id === updatedTour.tour._id ? updatedTour.tour : tour))
        );
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to update tour');
      }
    } catch (error) {
      console.error('Error updating tour:', error);
    } finally {
      setIsEditModalOpen(false);
      setSelectedTour(null);
    }
  };

  const toggleDropdown = (tourId) => {
    setActiveDropdown((prev) => (prev === tourId ? null : tourId));
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Tours</h1>
        <button className="add-tour-button" onClick={() => setIsAddModalOpen(true)}>
          <i className="fas fa-plus"></i>
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading tours...</p>
      ) : tours.length > 0 ? (
        <div className="tour-list">
          {tours.map((tour) => (
            <div key={tour._id} className="tour-item">
              <Link to={`/tour/${tour._id}`}>
                <h3>{tour.name}</h3>
                <p>
                  {new Date(tour.startDate).toLocaleDateString()} - {new Date(tour.endDate).toLocaleDateString()}
                </p>
              </Link>
              <div className="dropdown">
                <FaEllipsisV
                  className="dropdown-icon"
                  onClick={() => toggleDropdown(tour._id)}
                />
                {activeDropdown === tour._id && (
                  <div className="dropdown-menu">
                    <button onClick={() => handleEditTour(tour)}>Edit</button>
                    <button onClick={() => handleDeleteTour(tour._id)}>Delete</button>
                    <button onClick={() => navigate(`/tour/${tour._id}/participants`)}>
                    <Link to={`/tour/${tour._id}/participants`} className="leaderboard-icon">
                      <FaListOl />
                    </Link>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-tours">No tours available</p>
      )}

      {isAddModalOpen && (
        <AddTourModal onClose={() => setIsAddModalOpen(false)} onCreate={handleCreateTour} />
      )}

      {isEditModalOpen && (
        <EditTourModal
          tour={selectedTour}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveTour}
        />
      )}
    </div>
  );
}

export default Dashboard;
