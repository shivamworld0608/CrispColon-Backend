import User from '../models/User.js';

export const profile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password'); // Exclude password from the response
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({user});
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {

        const userId = req.user.id;
        const { name, email, phone, subscription,dob,gender } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ message: 'Name, email, and phone are required' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const cleandob = new Date(dob);
        cleandob.setHours(0, 0, 0, 0); 

        user.name = name;
        user.email = email;
        user.phone = phone;
        if(gender!="") user.gender = gender;
        if(dob) user.dob = cleandob;
        if (subscription) user.subscription = subscription; // Update subscription if provided

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

