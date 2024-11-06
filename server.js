require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User')
const app = express();


//protecting route
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')

app.use(cookieParser());
app.use(express.json()); // For parsing application/json


// Middleware to verify JWT
const authenticate = (req, res, next) => {
    
    const token = req.cookies.token; // Assuming the cookie name is 'token'
    console.log(token);
    if (!token) {
        return res.status(401).send('Unauthorized');
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('Forbidden');
        }
        req.user = user; // Attach user info to the request
        console.log(" inside middleware: ",req.user);
        next();
    });
};



//for x-ray
const multer = require('multer');
const axios = require("axios");
const fs = require("fs");



//x-ray handling multer configuration
// Set up storage and file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Initialize Multer
const upload = multer({ storage: storage });



//configuring cloudinary
const cloudinary=require("cloudinary").v2
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key:process.env.API_KEY,
  api_secret:process.env.API_SECRET
});




const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // React app running on this origin
  credentials: true, // This is necessary for setting cookies cross-origin
}));



//to check uploading x-ray
app.post("/api/upload",authenticate, upload.single("file"), async (req, res) => {
   const imagePath = req.file.path;
  try {
    // Send the image to the Python model server
    /* const response = await axios.post("http://localhost:5001/predict", {
      imagePath,
    }); */

    // Get prediction result from Python
    /*   const prediction = response.data.prediction; */
    const prediction = "Not positive";
    console.log("prediction: ",prediction);
    
    // Upload the image to Cloudinary
    const x = await cloudinary.uploader.upload(imagePath);
    console.log(x);

    // Clean up the uploaded image file
    fs.unlinkSync(imagePath);


    //updating user check history and finding user with help of cookie system
    const user = await User.findOne({_id:req.user.id});
    console.log(req.user);
    console.log(user);
    if (user) {
      console.log(user);
      user.history.push({ 
        date: new Date(), 
        images: [x.secure_url], // Push the image URL
        predictedResult: prediction 
      });

      await user.save();
      console.log("User history updated:", user.history);
    }
    
    res.json({ success: true, prediction });
  } catch (error) {
    console.error("Error sending image to Python model:", error);
    res.status(500).json({ success: false, error: "Prediction failed" });
  }
});


// Middleware
app.use(express.json());
app.use(cookieParser());


//making function to handle profile photo as middleware
const handleProfilePhoto = async (req, res) => {
  const profilePic = req.file.path;
  try{
    // Uploading the image to Cloudinary
    const x = await cloudinary.uploader.upload(profilePic);
    console.log(x);

    // Clean up the uploaded image file
    fs.unlinkSync(profilePic);


    // finding user with help of cookie system
    const user = await User.findOne({_id:req.user.id});

    //update profile pic
    if (user) {
      user.profilePic = x.secure_url;
      await user.save();
    }
    res.json({ success: true, profilePic: x.secure_url });
  } catch (error) {
    console.error("Error updating profile photo:", error);
    res.status(500).json({ success: false, error: "Profile Updation failed" });
  }
};


// Routes import
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');


// Routes
app.use('/api', authRoutes);
app.put('/profile/update-picture',authenticate, upload.single("file"),handleProfilePhoto);
app.use('/profile',authenticate,profileRoutes);


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
