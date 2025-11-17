const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['bike', 'scooter', 'ev'], default: 'bike' },
  description: String,
  modelYear: String,
  mileage: String,
  pricePerDay: { type: Number, default: 0 },
  pricePerWeek: { type: Number, default: 0 },
  pricePerMonth: { type: Number, default: 0 },
  images: [String],

  // --- LOCATION FIELD ADDED FOR SEARCHING ---
  location: { type: String, required: true },

  // New Document Fields for Vehicle Verification
  rcFile: String,
  insuranceFile: String,
  pollutionFile: String,
  isVerified: { type: Boolean, default: false } // Admin approval status

}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);