class SocketService {
  sendCarComplete(car) {
    console.log("Sending socket message..");
    app.io.emit('carCompleted', car);
  }
}

const singleton = new SocketService();

module.exports = singleton;