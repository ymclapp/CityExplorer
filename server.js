'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT;
const app = express();

app.use(cors()); //<<--need to have the inner parenthesis




app.get('/', (request, response) => {
  response.send('City Explorer Goes Here!');
});

app.get('/bad', (request, response) => {
  throw new Error('oops');
});


app.get('/location', (request, response) => {
  response.send('This will be where the location goes');
});

app.get('/weather', (request, response) => {
  response.send('Weather!');
});

//Has to be after stuff loads too
app.use(notFoundHandler);

//Has to be after stuff loads
app.use(errorHandler);

app.listen(PORT, () => console.log(`App is listening on ${PORT}`));  //<<--these are tics not single quotes

function errorHandler(error, request, response, next) {
  response.status(500).json({
    error: true,
    message: error.message,
  });
}

function notFoundHandler(request, response) {
  response.status(404).json({
    notFound:  true,
  });
}

