const express = require('express');
const router = express.Router();
const {profile,updateProfile} = require('../controller/profile');

router.get('/get',profile);
router.put('/update',updateProfile);

module.exports = router;
