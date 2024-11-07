import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../css/TourDetails.css';

function TourDetails() {
  const { tourId } = useParams();
  const [tour, setTour] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [checkInTime, setCheckInTime] = useState('');

  useEffect(() => {
    const fetchTour = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/tour/${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTour(data);
    };

    fetchTour();
  }, [tourId]);

  const handleAddCheckpoint = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8000/api/tour/${tourId}/add-checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: checkpointName, checkInTime }),
    });
    const updatedTour = await response.json();
    setTour(updatedTour);
    setIsModalOpen(false);
  };

  return (
    <div className="tour-details-container">
        <div className='tour-details-header'>
            <h1>{tour?.name} Checkpoints</h1>
            <button className="add-checkpoint-button" onClick={() => setIsModalOpen(true)}>
                <i className="fas fa-plus"></i>
            </button>
        </div>

      {tour?.events?.length ? (
        <div className="checkpoint-list">
          {tour.events.map((event) => (
            <div key={event._id} className="checkpoint-item">
              <h3>{event.name}</h3>
              <p>Check-In Time: {new Date(event.checkInTime).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No checkpoints added.</p>
      )}

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Checkpoint</h2>
            <label>Checkpoint Name</label>
            <input
              type="text"
              value={checkpointName}
              onChange={(e) => setCheckpointName(e.target.value)}
              placeholder="Enter checkpoint name"
            />

            <label>Check-In Time</label>
            <input
              type="datetime-local"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />

            <button onClick={handleAddCheckpoint}>Create Checkpoint</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TourDetails;
