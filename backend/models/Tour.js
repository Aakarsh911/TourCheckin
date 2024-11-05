const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  participants: [
    {
      participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Refers to a user as a participant
      checkInTime: { type: Date, default: null },
    }
  ]
});

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  events: [eventSchema]
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);
