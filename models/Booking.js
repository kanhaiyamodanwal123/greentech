// models/Booking.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  renter: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  totalAmount: { type: Number, default: 0 },

  // Booking status flow
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'completed'], 
    default: 'pending' 
  },

  // Track when owner responds (accept/reject)
  ownerResponseAt: { type: Date },

  // Payment tracking
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded'], 
    default: 'unpaid' 
  },
  utrNumber: { type: String }, // store UTR/Transaction ID
  
  // Feedback system
  review: { type: String },
  rating: { type: Number, min: 1, max: 5 },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
