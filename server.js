const axios = require("axios");
const fetch = require("node-fetch")
const { request, gql, GraphQLClient } = require("graphql-request");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');

console.log("date", Date.now())


const client = new GraphQLClient(process.env.HASURA_URI, {
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    }
});
const PORT = process.env.PORT || 4001;
const app = express();
app.use(cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false,
    parameterLimit: 50000
}));




const auth = require('./routes/auth')
const attendance = require('./routes/attendance')
const logs = require('./routes/logs')


app.use('/api/v1/auth', auth);
app.use('/api/v1/attendance', attendance);
app.use('/api/v1/logs', logs);














app.get('/test', (req, res) => {
  console.log("test")
})















app.listen(PORT, () => {
    console.log("app is running on server", PORT);
});