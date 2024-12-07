const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  qrCode: { type: String, default: '' }, // Stores the QR code URL or data URI
});

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  checkInTime: { type: Date, required: true },
  participants: [
    {
      participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true },
      checkInTime: { type: Date, default: null },
    },
  ],
});

const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participants: [participantSchema], // Stores participants with their QR codes
    events: [eventSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tour', tourSchema);
