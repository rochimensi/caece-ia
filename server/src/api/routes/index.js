const express = require('express');
const SeleniumController = require('../controllers/selenium.controller');

const router = express.Router();

router.post('/login', SeleniumController.login);
router.get('/logout', SeleniumController.logout);
router.get('/crawl', SeleniumController.crawlFollowers);

module.exports = router;
