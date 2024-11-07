import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddTourModal from '../components/AddTourModal';
import '../css/Dashboard.css';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/tour/my-tours', {
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
      const response = await fetch('http://localhost:8000/api/tour/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tourData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Tour created:', result);
        setTours((prevTours) => [...prevTours, result.tour]); // Update state to show new tour immediately
      } else {
        console.error('Error creating tour:', result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating tour:', error);
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Tours</h1>
        <button className="add-tour-button" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i>
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading tours...</p>
      ) : tours.length > 0 ? (
        <div className="tour-list">
          {tours.map((tour) => (
            <Link to={`/tour/${tour._id}`}>
                <div key={tour._id} className="tour-item">
                <h3>{tour.name}</h3>
                <p>
                    {new Date(tour.startDate).toLocaleDateString()} - {new Date(tour.endDate).toLocaleDateString()}
                </p>
                </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="no-tours">No tours available</p>
      )}

      {isModalOpen && (
        <AddTourModal onClose={() => setIsModalOpen(false)} onCreate={handleCreateTour} />
      )}
    </div>
  );
}

export default Dashboard;
