import express from 'express';
const router = express.Router();
import {profile,updateProfile} from '../controller/profile.js';

router.get('/get',profile);
router.put('/update',updateProfile);

export default router;