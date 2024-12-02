import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaCamera, FaCheckCircle } from 'react-icons/fa';
import QrScanner from 'react-qr-scanner';
import '../css/EventPage.css';

function EventPage() {
  const { tourId, eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`https://tourcheckin.onrender.com/api/tour/event/${eventId}`);
        const data = await response.json();
        console.log('Event data:', data);
        setEvent(data);
        setParticipants(data.participants || []);
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };

    fetchEvent();
  }, [eventId]);

    const handleScan = async (data) => {
        if (data) {
            setShowScanner(false);
            const scannedURL = data.text;
            const [_, email, name] = scannedURL.match(/checkin\/([^/]+)\/([^/]+)/) || [];
        
            if (!email || !name) {
                console.error("Invalid QR code format");
                return;
            }
            console.log('Scanned Data:', data.text); // Log the entire scanned data
            console.log('Parsed Email:', email); // Log parsed email
            console.log('Parsed Name:', name);   // Log parsed name
        
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}/check-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email, name, eventId }),
                });
        
                const result = await response.json();
                if (response.ok) {
                    // Update participant list to reflect the new check-in
                    setParticipants((prevParticipants) =>
                        prevParticipants.map((participant) =>
                        participant.participantId === result.participantId ? result : participant
                        )
                    );
                } else {
                    console.error("Error checking in participant:", result.message);
                }
            } catch (error) {
                console.error("Error during check-in:", error);
            }
        }
    };
  
  

  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
  };

  const handleStartCheckIn = () => {
    setShowScanner(true);
  };

  return (
    <div className="event-page">
        <div className='event-header'>
            <h1>{event?.name}</h1>
            <button className="start-checkin-button" onClick={handleStartCheckIn}>
                <FaCamera />
            </button>
        </div>

      {showScanner && (
        <div className="scanner-modal">
          <QrScanner
            onScan={handleScan}
            onError={handleError}
            style={{ width: '100%' }}
          />
          <button onClick={() => setShowScanner(false)}>Close Scanner</button>
        </div>
      )}

      <div className="participant-list">
        {participants
          .sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime)) // Sort by check-in time
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
                    : "Not Checked In"}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default EventPage;
