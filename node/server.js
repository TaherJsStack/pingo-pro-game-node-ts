const PORT = process.env.PORT || 4001;
const InvoiceService = require('./services/invoice.service');

require('events').EventEmitter.prototype._maxListeners = 10;

const express     = require("express");
// const mongoose    = require("mongoose");
const { connectDB }   = require("./DB/mongoDBConfig");
const bodyParser  = require("body-parser");
const path        = require("path");

const cors        = require('cors');

const app = express();

// const view       = require('./router/view');
const routerAPI  = require('./router/api');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, AppLanguage, Allowencrypt, cartId, favoriteId"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
});

app.use(async(req, res, next) => {
    // console.log("req.headers.Authorization ==>", req.headers);
    // console.log("req.headers.Authorization ==>", req.headers.authorization);
    // console.log("req.headers.applanguage ==>", req.headers.applanguage);

    // if (!req.headers.applanguage) {
    //   var err = new Error("no languge ");
    //   return next(err);
    // }

    // await i18n.setLocale(req.headers.applanguage || "en");
    // console.log(i18n.getLocale());
    next();
});

// app.use('/images', express.static(path.join(__dirname, 'images/products')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// include front lip like bootstrap
app.use('**/public', express.static(path.join( __dirname, 'public')));

connectDB();
// mongoose.set('useFindAndModify', false);


app.use("/api/v1",  routerAPI);
app.use("/", express.static(path.join(__dirname, "/views/browser/")));
// app.use("/", express.static(path.join(__dirname, "/views/server/")));
// app.use("/",    view);
    
const server = app.listen(PORT, () => console.log(`Magic Happens On Port localhost:${PORT}`));

const io = require('./socket').init(server);

// require('./controllers/api/user-io')(io);   
// require('./controllers/api/message-io')(io);

io.on('connection', socket => {

    socket.emit('myId', socket.id)

    socket.on('socketId:orders', (msg) => {
        // console.log('socketId:orders ---> ', msg);
        // console.log('socketId:orders ---> ', msg.ordrsId);
        
        for (let index = 0; index < msg.ordrsId.length; index++) {
            const element = msg.ordrsId[index];
            // console.log('element -->', element)
            Order.updateOne({_id: element}, { $set: { 'socketId': msg.socketId } }).then(res => {
                // console.log('Order.update ---> ', res);
            })
        }

    });

 })