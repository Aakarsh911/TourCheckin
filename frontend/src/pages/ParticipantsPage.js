import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaTrophy } from 'react-icons/fa'; // Import the trophy icon
import '../css/ParticipantsPage.css';

function ParticipantsPage() {
  const { tourId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}/participants-by-score`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setParticipants(data);
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [tourId]);

  return (
    <div className="participants-page">
      <h1>Participants by Score</h1>
      <Link to={`/dashboard`} className="back-button">Back</Link>
      {loading ? (
        <p>Loading participants...</p>
      ) : participants.length > 0 ? (
        <div className="participants-list">
          {participants.map((participant, index) => (
            <div key={participant._id} className="participant-item">
              <p>
                <strong>{index + 1}.</strong> {participant.name}{' '}
                {index === 0 && <FaTrophy className="trophy-icon" />} {/* Trophy for the first participant */}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No participants available.</p>
      )}
    </div>
  );
}

export default ParticipantsPage;
