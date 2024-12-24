import React, { useState } from 'react';
import '../css/Modal.css';

function EditTourModal({ tour, onClose, onSave }) {
  const [name, setName] = useState(tour.name);
  const [startDate, setStartDate] = useState(tour.startDate);
  const [endDate, setEndDate] = useState(tour.endDate);

  const handleSave = () => {
    onSave({ name, startDate, endDate });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Tour</h2>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Start Date</label>
        <input
          type="date"
          value={startDate.split('T')[0]}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <label>End Date</label>
        <input
          type="date"
          value={endDate.split('T')[0]}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
        <button onClick={handleSave} className="save-button">Save</button>
        <button className="cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default EditTourModal;
