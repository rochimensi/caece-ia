const chrome = require('selenium-webdriver/chrome');
const {Builder, By} = require('selenium-webdriver');
const path = require('path');
const fs = require('fs');
const util = require('util');
const Q = require('q');
const Path = require('path');
const Axios = require('axios');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

let driver, self;

class SeleniumController {

  constructor() {
    self = this;
  }


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
        return self.login(req, res, next);
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
    try {
      let followersUsernames = await readFile(path.join(__dirname, '../../followers/followers_usernames.txt'), 'utf-8');
      followersUsernames = followersUsernames.split(',');
      if(followersUsernames.length && followersUsernames[0] === '') {
        followersUsernames.shift();
      }
      let followersJSON = await readFile(path.join(__dirname, '../../followers/followers.json'), 'utf-8');
      followersJSON = JSON.parse(followersJSON);
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

        while(previousScrollHeight != currentScrollHeight) {
          await driver.executeScript(`document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollTop=(${currentScrollHeight})`);
          await driver.sleep(1000);
          previousScrollHeight = currentScrollHeight;
          currentScrollHeight = await driver.executeScript(`return document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollHeight`);
        }

        let followersLinks = await driver.findElements(By.css('div[role$="dialog"] li a'));
        await self.getFollowersModalChunk(followersUsernames, followersLinks, followersJSON);

        await writeFile(path.join(__dirname, '../../followers/followers_usernames.txt'), followersUsernames.join(','));
        await writeFile(path.join(__dirname, '../../followers/followers.json'), JSON.stringify(followersJSON));

        console.log("Followers files written!");

        res.status(200).send(followersJSON);
      } finally {

      }
    } catch(err) {
      console.log("Error building followers_usernames.txt file", err);
      res.sendStatus(500);
    }
  }

  async getFollowersModalChunk(followersUsernames, followersLinks, followersJSON) {
    await Promise.all(followersLinks.map(async (e) => {
      let href = await e.getAttribute('href'); //e.g. https://www.instagram.com/rosario.mensi/
      let username = href.replace('https://www.instagram.com/', '');
      username = username.replace('/', '');
      if (followersUsernames.indexOf(username) === -1) {
        followersUsernames.push(username);
      }
      if(!followersJSON[username] || !followersJSON[username].image) {
        let image;
        let style = await e.getAttribute('style');
        if (style === "width: 30px; height: 30px;") {
          image = await e.findElement(By.css('img'));
        }
        if (image) {
          let imageUrl = await image.getAttribute('src');
          followersJSON[username] = followersJSON[username] ? followersJSON[username].image = imageUrl : followersJSON[username] = {image: imageUrl};
        }
      }
    }));
  }

  async downloadImages(followersUsernames) {
    let deferred = Q.defer();
    await this.getUsersImage(followersUsernames, deferred);
    return deferred.promise;
  }

  async getUsersImage(followersUsernames, deferred) {
    let follower = followersUsernames.shift();
    if(!follower) return deferred.resolve();
    await this.downloadImage(follower.image, follower);
    await this.getUsersImage(followersUsernames, deferred);
  }

  async downloadImage (url, username) {
    const path = Path.resolve(__dirname, `../../followers/${username}`, `${username}.jpg`);
    const response = await Axios({method: 'GET', url: url, responseType: 'stream'});
    response.data.pipe(fs.createWriteStream(path));
    return new Promise((resolve, reject) => {
      response.data.on('end', () => resolve());
      response.data.on('error', (err) => reject(err));
    })
  }
}

const singleton = new SeleniumController();

module.exports = singleton;