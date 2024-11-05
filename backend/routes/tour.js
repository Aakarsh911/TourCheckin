const express = require('express');
const jwt = require('jsonwebtoken');
const Tour = require('../models/Tour');
const router = express.Router();

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Route to create a new tour
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, date } = req.body;
    const newTour = new Tour({ name, date, leader: req.user.id });
    await newTour.save();
    res.status(201).json({ message: 'Tour created successfully', tour: newTour });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route to add an event to a tour
router.post('/:tourId/add-event', authenticateToken, async (req, res) => {
  try {
    const { name, date } = req.body;
    const { tourId } = req.params;

    const newEvent = { name, date, participants: [] };
    const tour = await Tour.findByIdAndUpdate(
      tourId,
      { $push: { events: newEvent } },
      { new: true }
    );

    res.status(201).json({ message: 'Event added successfully', tour });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route to check in a participant for an event
router.post('/:tourId/:eventId/check-in', authenticateToken, async (req, res) => {
    try {
      const { participantId } = req.body;
      const { tourId, eventId } = req.params;
  
      const tour = await Tour.findById(tourId);
      if (!tour) return res.status(404).json({ message: 'Tour not found' });
  
      const event = tour.events.id(eventId);
      if (!event) return res.status(404).json({ message: 'Event not found' });
  
      // Check if the participant is already checked in
      const participant = event.participants.find(p => p.participantId.equals(participantId));
      if (participant) return res.status(400).json({ message: 'Participant already checked in' });
  
      // Add the participant with the current time as check-in time
      event.participants.push({ participantId, checkInTime: new Date() });
      await tour.save();
  
      res.status(200).json({ message: 'Participant checked in successfully', event });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });
  

module.exports = router;
