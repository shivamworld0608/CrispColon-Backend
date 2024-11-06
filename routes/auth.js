const express = require('express');
const { signup, verifyOTP } = require('../controller/auth');
const User = require('../models/User');
const router = express.Router();


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Signup route
router.post('/signup', signup);

// OTP verification route
router.post('/verify-otp', verifyOTP);



router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("inside login");

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true }); // Storing token in cookies
    res.json({ success: true, token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
