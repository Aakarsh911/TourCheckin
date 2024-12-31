import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCamera, FaCheckCircle, FaEllipsisV } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/EventPage.css';

function EventPage() {
  const { tourId, eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null); // Track active dropdown
  const cooldownRef = useRef(false); // Cooldown flag

  useEffect(() => {
    fetchUpdatedParticipants();
  }, [eventId]);

  const fetchUpdatedParticipants = async () => {
    try {
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/event/${eventId}`);
      const data = await response.json();
      setEvent(data);
      setParticipants(
        (data.participants || []).sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime))
      );
    } catch (error) {
      console.error("Error fetching updated participants:", error);
      toast.error("Failed to fetch participants.");
    }
  };

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
            if (!cooldownRef.current) {
              cooldownRef.current = true; // Activate cooldown
              console.log("QR Code Scanned:", decodedText);
              handleScan(decodedText); // Process the scanned QR code
              setTimeout(() => {
                cooldownRef.current = false; // Reset cooldown after 2 seconds
              }, 2000);
            }
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
          toast.error("Failed to start the scanner.");
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
    if (!decodedText) {
      toast.error("Invalid QR Code.");
      return;
    }
  
    const [_, email, name] = decodedText.match(/checkin\/([^/]+)\/([^/]+)/) || [];
  
    if (!email || !name) {
      console.error("Invalid QR code format");
      toast.error("Invalid QR code format.");
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, eventId }),
      });
  
      if (response.ok) {
        // Add green border effect to scanner
        const qrReaderElement = document.getElementById("qr-reader");
        qrReaderElement.classList.add("scanned");
  
        // Remove the green border effect after a short delay
        setTimeout(() => {
          qrReaderElement.classList.remove("scanned");
        }, 1000);
  
        fetchUpdatedParticipants(); // Refetch participants to update the list
        toast.success(`${name} checked in successfully!`);
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to check in participant.");
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast.error("An error occurred while checking in. Please try again.");
    }
  };
  

  const handleManualCheckIn = async (participant) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://tourcheckin.onrender.com/api/tour/${tourId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: participant.name, eventId }),
      });

      if (response.ok) {
        fetchUpdatedParticipants(); // Refetch participants to update the list
        toast.success(`${participant.name} checked in successfully!`);
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to check in participant.");
      }
    } catch (error) {
      console.error("Error during manual check-in:", error);
      toast.error("An error occurred while checking in. Please try again.");
    }
  };

  const handleStopScanner = () => {
    if (qrScanner && qrScanner.isScanning) {
      qrScanner.stop().catch((err) => console.error("Error stopping scanner:", err));
    }
    setShowScanner(false);
  };

  const toggleDropdown = (participantId) => {
    setActiveDropdown((prev) => (prev === participantId ? null : participantId));
  };

  return (
    <div className="event-page">
      <ToastContainer />
      <Link to={`/tour/${tourId}`} className="back">&lt; Back</Link>
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
        {participants.map((participant) => (
          <div key={participant.participantId} className="participant-item">
            <div className="participant-info">
              <span>{participant.name}</span>
              {participant.checkInTime && <FaCheckCircle className="checked-in-icon" />}
              <FaEllipsisV
                className="dropdown-icon"
                onClick={() => toggleDropdown(participant.participantId)}
              />
              {activeDropdown === participant.participantId && (
                <div className="dropdown-menu move-left">
                  <button onClick={() => handleManualCheckIn(participant)}>Check In</button>
                </div>
              )}
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
