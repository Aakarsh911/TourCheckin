import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaCamera, FaCheckCircle } from 'react-icons/fa';
import '../css/EventPage.css';

function EventPage() {
  const { tourId, eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`https://tourcheckin.onrender.com/api/tour/event/${eventId}`);
        const data = await response.json();
        setEvent(data);
        setParticipants(data.participants || []);
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleStartCheckIn = async () => {
    try {
      // Request the rear camera
      const constraints = {
        video: {
          facingMode: 'environment', // Use the rear camera
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setShowScanner(true);
    } catch (error) {
      console.error('Error accessing rear camera:', error);
      alert('Could not access the rear camera. Please ensure camera permissions are granted on your mobile device.');
    }
  };

  const handleStopScanner = () => {
    if (cameraStream) {
      const tracks = cameraStream.getTracks();
      tracks.forEach((track) => track.stop()); // Stop all tracks to release the camera
    }
    setCameraStream(null);
    setShowScanner(false);
  };

  const handleScan = (data) => {
    if (data) {
      console.log('Scanned Data:', data);
      handleStopScanner();
    }
  };

  const handleError = (err) => {
    console.error('Camera Error:', err);
  };

  return (
    <div className="event-page">
      <div className="event-header">
        <h1>{event?.name}</h1>
        <button className="start-checkin-button" onClick={handleStartCheckIn}>
          <FaCamera />
        </button>
      </div>

      {showScanner && (
        <div className="scanner-modal">
          <video
            autoPlay
            playsInline
            ref={(video) => {
              if (video && cameraStream) {
                video.srcObject = cameraStream; // Attach the stream to the video element
              }
            }}
            style={{ width: '100%' }}
          />
          <button onClick={handleStopScanner}>Close Scanner</button>
        </div>
      )}

      <div className="participant-list">
        {participants
          .sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime))
          .map((participant) => (
            <div key={participant.participantId} className="participant-item">
              <div className="participant-info">
                <span>{participant.name}</span>
                {participant.checkInTime && <FaCheckCircle className="checked-in-icon" />}
              </div>
              <div className="checkin-details">
                <p>
                  {participant.checkInTime
                    ? `${new Date(participant.checkInTime).toLocaleString()}`
                    : 'Not Checked In'}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default EventPage;
