import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "crispcolon.team@gmail.com",
    pass: "uyfcfkmjgycormrw"
  },
  timeout: 10000
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins

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
    console.log("Email: ",process.env.EMAIL_USER);
    console.log("Password: ",process.env.EMAIL_PASS);

    const mailOptions = {
      from: process.env.EMAIL_USER,
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

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending OTP:', error.message);
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
export const verifyOTP = async (req, res) => {
  try {
    const { UserId, otp } = req.body;
    const user = await User.findById(UserId);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (user.otp === otp && user.otpExpires > Date.now()) {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });
       
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

      return res.status(200).json({ message: 'OTP verified, signup complete', user });

    } else {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0), path: '/' });
  res.status(200).json({ message: 'Logged out successfully' });
}
