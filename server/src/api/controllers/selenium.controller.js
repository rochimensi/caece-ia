const chrome = require('selenium-webdriver/chrome');
const {Builder, By} = require('selenium-webdriver');
const path = require('path');
const fs = require('fs');
const util = require('util');
const Q = require('q');
const Path = require('path');
const Axios = require('axios');
var countFiles = require('count-files');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

const FOLLOWERS_COUNT = 383;

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
        res.sendStatus(200);
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
        if(followersUsernames.length < FOLLOWERS_COUNT) {
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

          while (previousScrollHeight != currentScrollHeight) {
            await driver.executeScript(`document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollTop=(${currentScrollHeight})`);
            await driver.sleep(1000);
            previousScrollHeight = currentScrollHeight;
            currentScrollHeight = await driver.executeScript(`return document.querySelector('div[role$="dialog"] div:nth-child(2)').scrollHeight`);
          }

          let followersListItems = await driver.findElements(By.css('div[role$="dialog"] li'));
          await self.getFollowersModalChunk(followersUsernames, followersListItems, followersJSON);

          await writeFile(path.join(__dirname, '../../followers/followers_usernames.txt'), followersUsernames.join(','));
          await writeFile(path.join(__dirname, '../../followers/followers.json'), JSON.stringify(followersJSON));

          console.log("Followers files written!");
        }

        await self.downloadImages(followersUsernames, followersJSON);

        await writeFile(path.join(__dirname, '../../followers/followers.json'), JSON.stringify(followersJSON));

        const imagesDir = Path.resolve(__dirname, `../../followers/images/`);
        let stats = countFiles(imagesDir, async (err, results) => {
          await driver.quit();
          res.status(200).send({followers: followersJSON, imagenes: results.files});
        });
      } finally {

      }
    } catch(err) {
      console.log("Error scanning followers. ", err);
      res.sendStatus(500);
    }
  }

  async getFollowersModalChunk(followersUsernames, followersListItems, followersJSON) {
    console.log("Building Followers JSON..");
    await Promise.all(followersListItems.map(async (listItem) => {
      let e = await listItem.findElement(By.css('a'));
      let href = await e.getAttribute('href'); //e.g. https://www.instagram.com/rosario.mensi/
      let username = href.replace('https://www.instagram.com/', '');
      username = username.replace('/', '');
      if (followersUsernames.indexOf(username) === -1) {
        followersUsernames.push(username);
        console.log("Added follower to followers_usernames");
      }
      if(!followersJSON[username] || !followersJSON[username].image) {
        if(!followersJSON[username]) {
          followersJSON[username] = {};
          console.log("Added follower to followers JSON");
        }
        let image;
        let style = await e.getAttribute('style');
        if (style === "width: 30px; height: 30px;") {
          image = await e.findElement(By.css('img'));
        }
        if (image) {
          followersJSON[username].image = await image.getAttribute('src');
          console.log("Added image for " + username +  " on followers JSON");
        } else {
          let imageWithStory = await listItem.findElements(By.css('span img'));
          imageWithStory = imageWithStory[0];
          followersJSON[username].image = await imageWithStory.getAttribute('src');
          console.log("Added image for " + username +  " on followers JSON");
        }
      }
    }));
  }

  async downloadImages(followersUsernames, followersJSON) {
    let deferred = Q.defer();
    await this.getUsersImages(followersUsernames, followersJSON, deferred);
    return deferred.promise;
  }

  async getUsersImages(followersUsernames, followersJSON, deferred) {
    let follower = followersUsernames.shift();
    if(!follower) return deferred.resolve();
    console.log("Downloading images for ", follower);
    let promise = await this.downloadImage(followersJSON[follower].image, follower);
    await this.getPostsAndName(follower, followersJSON, promise.skipped);
    await this.getUsersImages(followersUsernames, followersJSON, deferred);
  }

  async downloadImage (url, username) {
    let deferred = Q.defer();
    const directory = Path.resolve(__dirname, `../../followers/images/${username}`);
    const path = Path.resolve(__dirname, `../../followers/images/${username}`, `${username}.jpg`);
    fs.stat(directory, async (err, stat) => {
      if(!err) {
        console.log(`Skipping ${username} profile image download, already cached`);
        deferred.resolve({skipped: true});
      } else if(err.code === 'ENOENT') {
        await mkdir(directory);
        const response = await Axios({method: 'GET', url: url, responseType: 'stream'});
        response.data.pipe(fs.createWriteStream(path));
        deferred.resolve({});
      } else {
        console.log('Some other error: ', err.code);
        deferred.reject();
      }
    });

    return deferred.promise;
  }

  async getPostsAndName(username, followersJSON, skip) {
    if(skip) return Q.when();

    let deferred = Q.defer();
    await driver.get('https://www.instagram.com/' + username + '/');
    try {
      let name = await driver.findElement(By.xpath("(//h1)[2]")).getText();
      followersJSON[username].fullName = name;
    } catch(err) {

    }
    let followersPosts = await driver.findElements(By.css('article a img'));
    await this.getFollowerPosts(username, followersPosts, followersJSON);
    await this.downloadPosts(username, followersJSON);

    deferred.resolve();
    return deferred.promise;
  }

  async getFollowerPosts(username, posts, followersJSON) {
    console.log("Crawling posts image urls for ", username);
    await Promise.all(posts.map(async (e) => {
      followersJSON[username].posts = followersJSON[username].posts || [];
      let url = await e.getAttribute('src');
      followersJSON[username].posts.push(url);
    }));
  }

  async downloadPosts(username, followersJSON) {
    let deferred = Q.defer();
    console.log("Downloading post for ", username);
    await this.getUserPosts(username, followersJSON[username].posts, deferred);
    return deferred.promise;
  }

  async getUserPosts(username, posts, deferred) {
    let post = posts && posts.shift() || null;
    if(!post) return deferred.resolve();
    await this.downloadPost(post, username);
    await this.getUserPosts(username, posts, deferred);
  }

  async downloadPost(url, username) {
    let deferred = Q.defer();
    const path = Path.resolve(__dirname, `../../followers/images/${username}`, `${new Date().getTime()}.jpg`);
    const response = await Axios({method: 'GET', url: url, responseType: 'stream'});
    response.data.pipe(fs.createWriteStream(path));
    deferred.resolve();
    return deferred.promise;
  }

}

const singleton = new SeleniumController();

module.exports = singleton;