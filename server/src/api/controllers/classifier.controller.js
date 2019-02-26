class ClassifierController {

  constructor() {
    self = this;
  }

  async classify(req, res, next) {

  }
}

const singleton = new ClassifierController();

module.exports = singleton;