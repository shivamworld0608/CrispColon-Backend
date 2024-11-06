const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  timeout: 10000
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
};

// Signup Controller
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

     console.log("signup insider");
    // Check if user already exists
    const existingUser = await User.findOne({ email });
     console.log("checked for if user exist");
    if (existingUser) {
      console.log("user is existing");
      return res.status(400).json({ message: 'User already exists' });
    }
    console.log("no user is existing");

    // Generate OTP and its expiry (5 minutes)
    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins


    // Create new user but set isVerified to false initially
    const newUser = new User({
      name,
      email,
      phone,
      password,
      otp,
      otpExpires,
    });

    // Save the user (without verification)
    await newUser.save();
    console.log("user saved");
    // Send OTP via email
/*     const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Signup',
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };
 */
    const mailOptions = {
      from: process.env.EMAIL_USER, // Update this to your CrispColon email address
      to: email,
      subject: 'Your OTP for Signup',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px;">
              <h2 style="text-align: center; color: #007BFF;">Welcome to CrispColon</h2>
              <img src="https://res.cloudinary.com/db63l67rf/image/upload/v1730918253/pupbiyecwzxz4cjfkzz1.png" alt="CrispColon Logo" style="display: block; margin: 0 auto; max-width: 150px;" />
              <p style="font-size: 16px; line-height: 1.6;">
                Dear ${name},
              </p>
              <p style="font-size: 16px; line-height: 1.6;">
                Thank you for registering with CrispColon! Please use the following OTP to complete your signup process:
              </p>
              <h3 style="font-size: 24px; color: #007BFF; text-align: center;">
                ${otp}
              </h3>
              <p style="font-size: 16px; line-height: 1.6;">
                This OTP is valid for 5 minutes. If you did not request this, please ignore this email.
              </p>
              <p style="font-size: 14px; color: #888; text-align: center;">
                If you have any questions, feel free to contact our support team.
              </p>
            </div>
          </body>
        </html>
      `,
    };
    










    console.log("just to send mail");
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending OTP:', error);
        return res.status(500).json({ message: 'Error sending OTP' });
      } else {
        console.log('OTP sent:', info.response);
        return res.status(200).json({ message: 'OTP sent successfully', userId: newUser._id });
      }
    });

  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { UserId, otp } = req.body;
    console.log("incoming otp:",otp);
    console.log("inside otp function");
    // Find user by ID
    const user = await User.findById(UserId);
    //user otp console
    console.log("user info:",user);
    console.log("user otp:", user.otp);
    console.log("user mail:",user.email);
    console.log("just checked the user");
    if (!user) {
        console.log("user not found");
      return res.status(400).json({ message: 'User not found' });
    }
    console.log("user found");
    // Check if OTP matches and is not expired
    if (user.otp === otp && user.otpExpires > Date.now()) {
      console.log("otp matched");
      // OTP is correct, verify the user
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      // Create JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });
       
      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.status(200).json({ message: 'OTP verified, signup complete', token });
    } else {
      console.log("otp not matched");
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
