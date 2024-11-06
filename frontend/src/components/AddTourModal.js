import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import '../css/AddTourModal.css';

function AddTourModal({ onClose, onCreate }) {
  const [tourName, setTourName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participants, setParticipants] = useState([]);
  const [uploadMode, setUploadMode] = useState('file');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      const parsedParticipants = parsedData.map((row) => ({
        name: row.Name,
        email: row.Email,
      }));

      setParticipants(parsedParticipants);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '', email: '' }]);
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index][field] = value;
    setParticipants(updatedParticipants);
  };

  const handleSubmit = () => {
    if (!tourName || !startDate || !endDate || participants.length === 0) {
      alert('Please complete all fields and add at least one participant.');
      return;
    }

    onCreate({
      name: tourName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      participants,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Tour</h2>
        <button className="close-button" onClick={onClose}>X</button>

        <label>Tour Name</label>
        <input
          type="text"
          value={tourName}
          onChange={(e) => setTourName(e.target.value)}
          placeholder="Enter tour name"
        />

        <label>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label>End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <label>Participants</label>
        <div className="upload-options">
          <button onClick={() => setUploadMode('file')} className={uploadMode === 'file' ? 'active' : ''}>Upload Excel</button>
          <button onClick={() => setUploadMode('manual')} className={uploadMode === 'manual' ? 'active' : ''}>Manual Entry</button>
        </div>

        {uploadMode === 'file' ? (
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        ) : (
          <>
            {participants.map((participant, index) => (
              <div key={index} className="participant-entry">
                <input
                  type="text"
                  placeholder="Name"
                  value={participant.name}
                  onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={participant.email}
                  onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                />
              </div>
            ))}
            <button onClick={handleAddParticipant} className="add-participant-button">+ Add Participant</button>
          </>
        )}

        <button className="create-tour-button" onClick={handleSubmit}>Create Tour</button>
      </div>
    </div>
  );
}

export default AddTourModal;
