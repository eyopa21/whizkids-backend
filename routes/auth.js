const express = require('express');
const router = express.Router();
const {
    login,
     registerEmployee,
  adminLogin
    
} = require('../controllers/auth')

router.route('/login').post(login)
router.route('/registeremployee').post(registerEmployee)
router.route('/adminlogin').post(adminLogin)


module.exports = router;