const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
 
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, uuidv4() + '-' + file.originalname);
      }
});

const fileFilter = (req, file, cb) => {
    if(
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' 
    ) {
        cb(null,true);
    }else {
        cb(null,false);
    }
}



// app.use(bodyParser.urlencoded()); //x-www-form-urlencoded <form>
app.use(bodyParser.json()); //application/json <- app that send and recive json data

app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter}).single('image')
);

//Path join will created an absolute path to allow the user to see the images saved on the server
app.use('/images', express.static(path.join(__dirname, 'images')));

//Cors Configuration
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

app.use('/feed',feedRoutes);
app.use('/auth',authRoutes);

//Error handling middleware
app.use((error, req, res,next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
});

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.dwn83ww.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`;

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    const server = app.listen(process.env.PORT || 8080); //The server we create at port 8080 ('http')
    const io = require('./socket').init(server);//Websocket created with the http 
    io.on('connection', connectionServerUser => { 
      console.log('Client connected');
    });
})
  .catch(err => {
    console.log(err);
  });
