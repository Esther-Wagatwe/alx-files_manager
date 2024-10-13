const express = require('express');
import AppController from '../controllers/AppController'; 

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

export default router;
