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
  
  

module.exports = router;
