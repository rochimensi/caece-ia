const express = require('express');
const SeleniumController = require('../controllers/selenium.controller');
const ClassifierController = require('../controllers/classifier.controller');

const router = express.Router();

router.post('/login', SeleniumController.login);
router.get('/logout', SeleniumController.logout);
router.get('/crawl', SeleniumController.crawlFollowers);
router.get('/classify', ClassifierController.classify);

module.exports = router;
