'use strict';

require('dotenv').config();

const { response } = require('express');
const express = require('express');

const PORT = process.env.PORT;
const app = express();

app.get('/', (request, response) => {
  response.send('City Explorer Goes Here!');
});
app.get('/location', (request, response) => {
  response.send('This will be where the location goes');
});

app.get('/weather', (request, response) => {
  response.send('Weather!');
});

app.listen(PORT, () => console.log('App is listening on ${PORT}'));

