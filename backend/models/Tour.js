const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const eventParticipantSchema = new mongoose.Schema({
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkInTime: { type: Date, default: null },
});

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  participants: [eventParticipantSchema], // Participants with check-in time for this event
});

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  participants: [participantSchema], // General list of participants without check-in time
  events: [eventSchema],
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);
