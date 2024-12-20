import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCamera, FaCheckCircle } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import '../css/EventPage.css';

function EventPage() {
  const { tourId, eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);

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

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5Qrcode("qr-reader");

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log("QR Code Scanned:", decodedText);
            handleScan(decodedText);
          },
          (errorMessage) => {
            console.error("QR Code Error:", errorMessage);
          }
        )
        .then(() => {
          setQrScanner(scanner);
        })
        .catch((err) => {
          console.error("QR Scanner Error:", err);
          setShowScanner(false);
        });
    }

    return () => {
      if (qrScanner && qrScanner.isScanning) {
        qrScanner
          .stop()
          .then(() => {
            console.log("QR Scanner stopped.");
          })
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [showScanner]);

  const handleScan = async (decodedText) => {
    setShowScanner(false);
    if (!decodedText) {
      alert("Invalid QR Code.");
      return;
    }

    const [_, email, name] = decodedText.match(/checkin\/([^/]+)\/([^/]+)/) || [];

    if (!email || !name) {
      console.error("Invalid QR code format");
      alert("Invalid QR code format.");
      return;
    }

    console.log("Parsed Email:", email);
    console.log("Parsed Name:", name);

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
        setParticipants((prevParticipants) =>
          prevParticipants.map((participant) =>
            participant.participantId === result.participantId
              ? { ...participant, checkInTime: result.checkInTime }
              : participant
          )
        );
      } else {
        console.error("Error checking in participant:", result.message);
      }
    } catch (error) {
      console.error("Error during check-in:", error);
    }
  };

  const handleStopScanner = () => {
    if (qrScanner && qrScanner.isScanning) {
      qrScanner
        .stop()
        .then(() => {
          console.log("QR Scanner stopped.");
        })
        .catch((err) => console.error("Error stopping scanner:", err));
    }
    setShowScanner(false);
  };

  return (
    <div className="event-page">
      <Link to={`/tour/${tourId}`} className="back">&lt;</Link>
      <div className="event-header">
        <h1>{event?.name}</h1>
        <button className="start-checkin-button" onClick={() => setShowScanner(true)}>
          <FaCamera />
        </button>
      </div>

      {showScanner && <div id="qr-reader" style={{ width: "100%" }}></div>}

      {showScanner && (
        <button onClick={handleStopScanner} style={{ marginTop: "10px" }}>
          Stop Scanner
        </button>
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
