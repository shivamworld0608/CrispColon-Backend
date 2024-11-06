const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  profilePic: {
    type: String,
  },
  subscription:{
    type: String,
    enum: ['Basic', 'Standard', 'Premium'],
    default: 'Basic',
  },
  history: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      images: [
        {
          type: String,
        }
      ],
      predictedResult: {
        type: String, // e.g., "Positive", "Negative", or a specific diagnosis
      },
    },
  ],
});

// Hash password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// Create the User model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
