const chrome = require('selenium-webdriver/chrome');
const {Builder, By} = require('selenium-webdriver');
const path = require('path');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const appendFile = util.promisify(fs.appendFile);

let driver;

class SeleniumController {

  async login(req, res, next) {
    try {
      if(!driver) {
        driver = new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();
      }
      await driver.get('https://www.instagram.com/accounts/login/');
      await driver.findElement(By.name('username')).sendKeys(req.body.username);
      await driver.findElement(By.name('password')).sendKeys(req.body.password);
      await driver.findElement(By.css('button[type=submit]')).click();
      await driver.sleep(1500);
      try {
        await driver.findElement(By.id('slfErrorAlert'));
        return res.sendStatus(401);
      } catch(err) {
        await driver.get('https://www.instagram.com/' + req.body.username);
        let profile_pic = await driver.executeScript(`return document.querySelector('button[title$="Change Profile Photo"] img')`);
        const src = await profile_pic.getAttribute('src');
        res.status(200).send({profile_image: src});
      }
    } catch(err) {
      if(err.WebDriverError === 'chrome not reachable') {
        driver = new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();
        return this.login(req, res, next);
      }
    } finally {

    }
  }

  async logout(req, res, next) {
    try {
      await driver.quit();
      driver = null;
      res.sendStatus(200);
    } finally {

    }
  }

  async crawlFollowers(req, res, next) {
    // CRAWL USERNAMES
    try {
      let followersUsernames = await readFile(path.join(__dirname, '../../followers/followers_usernames.txt'), 'utf-8');
      followersUsernames = followersUsernames.split(',');
      if(followersUsernames.length && followersUsernames[0] === '') {
        followersUsernames.shift();
      }
      let followers = "";
      try {
        await driver.findElement(By.partialLinkText('followers')).click();
        await driver.sleep(2000);

        // Workaround to get the infinite scroll
        driver.executeScript(`document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollTop=${500}`);
        await driver.findElement(By.css('div[role$="dialog"] div:nth-child(1) button')).click();
        await driver.sleep(2000);
        await driver.findElement(By.partialLinkText('followers')).click();
        await driver.sleep(2000);
        await driver.executeScript(`document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollTop=(document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollHeight)`);
        driver.sleep(4000);

        let previousScrollHeight = 1;
        let currentScrollHeight = await driver.executeScript(`return document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollHeight`);

        while(previousScrollHeight !== currentScrollHeight) {
          await driver.executeScript(`document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollTop=(document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollHeight)`);
          previousScrollHeight = currentScrollHeight;
          currentScrollHeight = await driver.executeScript(`return document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollHeight`);

          let followersLinks = await driver.findElements(By.css('div[role$="dialog"] li a'));
          console.log(followersUsernames);
          followersLinks.forEach(async (e) =>{
            let href = await e.getAttribute('href');
            let username = href.replace('https://www.instagram.com/', '');
            username = username.replace('/', '');
            if(followersUsernames.indexOf(username) === -1){
              followersUsernames.push(username);
              if(!followers.length) {
                followers += username;
              } else followers += ',' + username;
            } else {
              previousScrollHeight = currentScrollHeight; // Force while break. The username was already crawled.
            }
          });
        }

        await appendFile(path.join(__dirname, '../../followers/followers_usernames.txt'), followersUsernames.join(','));
        res.status(200).send(followersUsernames);
      } finally {

      }
    } catch(err) {
      console.log("Error reading followers_usernames.txt file", err);
      res.sendStatus(500);
    }

  }
}

const singleton = new SeleniumController();

module.exports = singleton;