const User = require('../models/User');

// Get user profile
const profile = async (req, res) => {
    try {
        // Use req.user populated by the authenticate middleware
        const userId = req.user.id; // Access the user ID from the JWT
        console.log("inside profile: ",userId);
        const user = await User.findById(userId).select('-password'); // Exclude password from the response
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log("inside profile: ",user);
        res.json({user});
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {

        // Use req.user populated by the authenticate middleware
        const userId = req.user.id; // Access the user ID from the JWT
        const { name, email, phone, subscription,dob,gender } = req.body;

        // Validate input
        if (!name || !email || !phone) {
            return res.status(400).json({ message: 'Name, email, and phone are required' });
        }

        // Find user by ID and update
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove the time portion from dob (if provided)
        const cleandob = new Date(dob);
        cleandob.setHours(0, 0, 0, 0);  // Setting the time to midnight

        user.name = name;
        user.email = email;
        user.phone = phone;
        user.dob = cleandob;
        user.gender = gender;
        if (subscription) user.subscription = subscription; // Update subscription if provided

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { profile, updateProfile };
