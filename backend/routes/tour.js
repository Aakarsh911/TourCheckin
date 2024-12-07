const express = require('express');
const jwt = require('jsonwebtoken');
const Tour = require('../models/Tour');
const router = express.Router();

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    console.log('Received token:', token); // Log the token for troubleshooting
  
    if (!token) {
      return res.status(401).json({ message: 'Access token missing' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('Token verification error:', err); // Log specific token verification errors
        return res.status(403).json({ message: 'Invalid token' });
      }
      req.user = user;
      next();
    });
}
  

const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function createQRCodePDF(participants, leaderEmail) {
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, 'qrcodes.pdf');
    doc.pipe(fs.createWriteStream(pdfPath));
  
    for (const participant of participants) {
      doc.addPage();
      doc.fontSize(18).text(`Participant: ${participant.name}`, 100, 100);
      doc.text(`Email: ${participant.email}`, 100, 130);
      doc.image(participant.qrCode, { fit: [200, 200], align: 'center', valign: 'center' });
    }
  
    doc.end();
    return pdfPath;
}
  
async function sendEmailWithPDF(pdfPath, leaderEmail) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: leaderEmail,
        subject: 'QR Codes for Tour Participants',
        text: 'Attached is a PDF containing QR codes for each participant. Please print and distribute.',
        attachments: [
        {
            filename: 'qrcodes.pdf',
            path: pdfPath,
            contentType: 'application/pdf',
        },
        ],
};

await transporter.sendMail(mailOptions);
fs.unlinkSync(pdfPath); // Delete the PDF after sending
}
  

router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name, startDate, endDate, participants } = req.body;

        // Generate QR codes for each participant
        const participantsWithQRCode = await Promise.all(
        participants.map(async (participant) => {
            const qrData = `https://your-app-url.com/checkin/${participant.email}/${participant.name}`;
            const qrCodeDataUri = await QRCode.toDataURL(qrData);
            return { ...participant, qrCode: qrCodeDataUri }; // Add QR code data URI
        })
        );

        console.log(req.user);

        const newTour = new Tour({
        name,
        startDate,
        endDate,
        leader: req.user.id,
        participants: participantsWithQRCode,
        events: [],
        });

        await newTour.save(); // Save the tour with QR codes stored in each participant

        // Generate and email PDF with QR codes
        const pdfPath = await createQRCodePDF(newTour.participants, req.user.email);
        await sendEmailWithPDF(pdfPath, req.user.email);

        res.status(201).json({ message: 'Tour created successfully', tour: newTour });
    } catch (error) {
        console.error('Error saving tour:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

router.get('/my-tours', authenticateToken, async (req, res) => {
    try {
      const tours = await Tour.find({ leader: req.user.id });
      res.json(tours);
    } catch (error) {
      console.error('Error fetching tours:', error);
      res.status(500).json({ message: 'Server error', error });
    }
});


router.post('/:tourId/add-checkpoint', authenticateToken, async (req, res) => {
    const { tourId } = req.params;
    const { name, checkInTime } = req.body;

    console.log("req:" + req.body);
  
    try {
      // Find the tour by ID
      const tour = await Tour.findById(tourId);
      if (!tour) {
        return res.status(404).json({ message: 'Tour not found' });
      }

      console.log(checkInTime);
  
      // Create the new checkpoint with participants from the tour
      const newCheckpoint = {
        name,
        checkInTime,
        participants: tour.participants.map(participant => ({
          participantId: participant._id, // Link each participant ID
          name: participant.name,
          checkInTime: null, // Initial check-in time is set to null
        })),
      };
  
      // Add the new checkpoint to the tour's events array
      tour.events.push(newCheckpoint);
      await tour.save();
  
      res.status(201).json({ message: 'Checkpoint added successfully', tour });
    } catch (error) {
      console.error('Error adding checkpoint:', error);
      res.status(500).json({ message: 'Server error', error });
    }
});

router.get('/:tourId', authenticateToken, async (req, res) => {
    const { tourId } = req.params;
  
    try {
      const tour = await Tour.findById(tourId).populate('events');
      if (!tour) {
        return res.status(404).json({ message: 'Tour not found' });
      }
  
      res.json(tour);
    } catch (error) {
      console.error('Error fetching tour:', error);
      res.status(500).json({ message: 'Server error', error });
    }
});
  

// Route to check in a participant for an event
router.post('/:tourId/check-in/', authenticateToken, async (req, res) => {
    const { tourId } = req.params;
    const { email, name, eventId } = req.body;

    console.log('Tour ID:', tourId);  // Log tourId
    console.log('Event ID:', eventId); // Log eventId
    console.log('Request Body Email:', email); // Log email from request body
    console.log('Request Body Name:', name);   // Log name from request body
  
    try {
      const tour = await Tour.findById(tourId);
      if (!tour) return res.status(404).json({ message: 'Tour not found' });
  
      const event = tour.events.id(eventId);
      if (!event) return res.status(410).json({ message: 'Event not found' });
  
      // Find the participant by email and name

      console.log('Event Participants:', event.participants); // Log event participants

      const participant = event.participants.find(
        (p) => p.name === name
      );
  
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }
  
      // Check if the participant has already been checked in
      if (participant.checkInTime) {
        return res.status(400).json({ message: 'Participant already checked in' });
      }
  
      // Set the check-in time
      participant.checkInTime = new Date();
      await tour.save();
  
      res.status(200).json(participant); // Send updated participant info back
    } catch (error) {
      console.error('Error checking in participant:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

// Route to fetch event details including participants
router.get('/event/:eventId', async (req, res) => {
    const { eventId } = req.params;
  
    try {
      const tour = await Tour.findOne({ 'events._id': eventId }, { 'events.$': 1 });
      const event = tour?.events?.[0];
  
      if (event) {
        res.json({
          _id: event._id,
          name: event.name,
          checkInTime: event.checkInTime,
          participants: event.participants, // Should include participant details
        });
      } else {
        res.status(404).json({ message: 'Event not found' });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });
  

// Route to get all tours for the logged-in user
router.get('/my-tours', authenticateToken, async (req, res) => {
    try {
      const tours = await Tour.find({ leader: req.user.id }).populate('events');
      console.log('Tours:', tours);
      res.json(tours);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
});
  
router.post('/:eventId/check-in', async (req, res) => {
    const { eventId } = req.params;
    const { qrData } = req.body;
  
    try {
      // Assuming qrData uniquely identifies a participant
      const participantId = qrData; // Map qrData to participant ID if needed
  
      const tour = await Tour.findOne({ 'events._id': eventId });
      const event = tour.events.id(eventId);
  
      const participant = event.participants.find(
        (p) => p.participantId.toString() === participantId
      );
  
      if (participant) {
        participant.checkInTime = new Date(); // Set check-in time to now
        await tour.save();
  
        res.json(participant);
      } else {
        res.status(404).json({ message: 'Participant not found' });
      }
    } catch (error) {
      console.error('Error checking in participant:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

module.exports = router;
