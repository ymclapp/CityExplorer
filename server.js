'use strict';

require('dotenv').config();

const express = require('express');

const PORT = process.env.PORT;
const app = express();

app.get('/', (request, response) => {
    response.send('Home Page!');
});

app.listen(PORT, () => console.log('App is listening on ${PORT}'));
