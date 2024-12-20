import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../css/TourDetails.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function TourDetails() {
  const { tourId } = useParams();
  const [tour, setTour] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  useEffect(() => {
    const fetchTour = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTour(data);
    };

    fetchTour();
  }, [tourId]);

  const handleAddCheckpoint = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}/add-checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: checkpointName, checkInTime }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add checkpoint');
      }
  
      const { tour } = await response.json();
  
      // Extract the last added checkpoint (assuming it's appended to the end)
      const newCheckpoint = tour.events[tour.events.length - 1];
  
      // Ensure the new checkpoint has the expected properties
      if (!newCheckpoint.name || !newCheckpoint.checkInTime) {
        console.error('Incomplete checkpoint data received:', newCheckpoint);
        toast.error('Failed to add checkpoint. Please try again.');
        return;
      }
  
      // Update the tour's events state without refreshing the page
      setTour((prevTour) => ({
        ...prevTour,
        events: [...(prevTour.events || []), newCheckpoint],
      }));
  
      setCheckpointName('');
      setCheckInTime('');
      setIsModalOpen(false);
  
      toast.success('Checkpoint added successfully!', {
        autoClose: 1000,
      });
    } catch (error) {
      console.error('Error adding checkpoint:', error);
      toast.error('An error occurred while adding the checkpoint.');
    }
  };
  
  

  const handleEditCheckpoint = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `https://tourcheckin.onrender.com/api/tour/${tourId}/update-checkpoint/${selectedCheckpoint._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: checkpointName,
            checkInTime,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update checkpoint');
      }

      const updatedTour = await response.json();
      setTour(updatedTour);

      setCheckpointName('');
      setCheckInTime('');
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating checkpoint:', error);
    }
  };

  const handleDeleteCheckpoint = async (eventId) => {
    const token = localStorage.getItem('token');
    try {
      console.log(`Deleting event with ID: ${eventId}`);
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        setTour((prevTour) => ({
          ...prevTour,
          events: prevTour.events.filter((event) => event._id !== eventId),
        }));
        toast.success('Checkpoint deleted successfully');
      } else {
        const result = await response.json();
        toast.error(result.message || 'Failed to delete checkpoint');
      }
    } catch (error) {
      console.error('Error deleting checkpoint:', error);
      toast.error('An error occurred while deleting the checkpoint');
    }
  };
  
  

  return (
    <div className="tour-details-container">
      <Link to="/dashboard" className="back">&lt; Back</Link>
      <div className="tour-details-header">
        <h1>{tour?.name} Checkpoints</h1>
        <button className="add-checkpoint-button" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i>
        </button>
      </div>

      {tour?.events?.length ? (
        <div className="checkpoint-list">
          {tour.events.map((event) => (
            <div className="checkpoint-item" key={event._id}>
              <Link to={`/event/${tourId}/${event._id}`} className="checkpoint-item-link">
                <h3>{event.name}</h3>
                <p>Check-In Time: {new Date(event.checkInTime).toLocaleString()}</p>
              </Link>
              <div className="dropdown-container">
                <button className="dropdown-button">⋮</button>
                <div className="dropdown-menu">
                  <button
                    onClick={() => {
                      setSelectedCheckpoint(event);
                      setCheckpointName(event.name);
                      setCheckInTime(event.checkInTime);
                      setEditModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteCheckpoint(event._id)}>Delete</button>
                </div>
              </div>
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
              required
            />

            <label>Check-In Time</label>
            <input
              type="datetime-local"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              required
            />

            <button onClick={handleAddCheckpoint}>Create Checkpoint</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Checkpoint</h2>
            <label>Checkpoint Name</label>
            <input
              type="text"
              value={checkpointName}
              onChange={(e) => setCheckpointName(e.target.value)}
              required
            />

            <label>Check-In Time</label>
            <input
              type="datetime-local"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              required
            />

            <button onClick={handleEditCheckpoint}>Save Changes</button>
            <button onClick={() => setEditModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TourDetails;
