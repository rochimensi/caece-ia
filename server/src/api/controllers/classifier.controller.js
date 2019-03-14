const Classifier = require("../../../../controller/start.js");

let self;
class ClassifierController {

  constructor() {
    self = this;
  }

  async classify(req, res, next) {
    try {
      let results = await Classifier.classify();
      res.status(200).send(results);
    } catch(err) {
      res.status(500).send(err);
    }
  }
}

const singleton = new ClassifierController();

module.exports = singleton;