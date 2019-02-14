Promise = require('bluebird');
const logger = require('./config/logger');
const {port} = require('./config/vars');

app = require('./config/express'); // app instance will be global

const server = require('http').createServer(app);
app.io = require('socket.io')(server);

server.listen(port, () => logger.info(`Server started on port 3000`));
