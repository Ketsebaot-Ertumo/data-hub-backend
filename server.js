// server.js
require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');

app.use(express.json());

const { sequelize } = require('./models/index');
const authRoute = require('./routes/authRoute');
const roleRoute = require('./routes/roleRoute');
const userRoute = require('./routes/userRoute');
const branchRoute = require('./routes/branchRoute');
const customerRoute = require('./routes/customerRoute');
const salesRoute = require('./routes/salesRoute');
const organRoute = require('./routes/organRoute');
const productRoute = require('./routes/productRoute');
const searchRoute = require('./routes/searchRoute');
const rpRoute = require('./routes/rpRoute');
const apiGenRoute = require('./routes/apiGenerationRoute');
const userActivityRoute = require('./routes/userActivityRoute');
const filterRoute = require('./routes/filterRoute');
const notificationRoute = require('./routes/notificationRoute');
const companyRoute = require('./routes/companyRoute');
const test =require('./routes/test');

const PORT = process.env.PORT || process.env.DB_PORT;


const allowedOrigins = ['http://localhost:3000', 'https://te-data-frontend-x1vy-ghl27v80u-te-frontend.vercel.app/']
app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// app.use(cors({origin: true, credentials: true}));
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Credentials', 'true');
//     next();
//   });

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    next();
  });


sequelize
    .authenticate()
    .then(() => {
        console.log('Connected to the database');
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);
    });

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({
    limit: "25mb", extended: true
}));
app.use(cookieParser());
// app.use(cors());
app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("Welcome, `TE Data Analysis`!");
});
app.use('/api/auth', authRoute);
app.use('/api/role', roleRoute);
app.use('/api/user', userRoute);
app.use('/api/branch', branchRoute);
app.use('/api/customer', customerRoute);
app.use('/api/sales', salesRoute);
app.use('/api/organ', organRoute);
app.use('/api/product', productRoute);
app.use('/api/search', searchRoute);
app.use('/api/rp', rpRoute);
app.use('/api', apiGenRoute);
app.use('/api', userActivityRoute);
app.use('/api/filter', filterRoute);
app.use('/api/notification', notificationRoute);
app.use('/api/company', companyRoute);
app.use('/api', test)


