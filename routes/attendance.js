const express = require('express');
const router = express.Router();
const {
   attend
} = require('../controllers/attendance')

router.route('/attend').post(attend)


module.exports = router;