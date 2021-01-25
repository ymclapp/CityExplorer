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


app.get('/location', locationHandler);
app.get('/weather', weatherHandler);

// app.get('/weather', (request, response) => {
//   response.send('Weather!');
// });


function locationHandler(request, response) {
  const geoData = require('./data/geo.json');//<<--will end up changing to the API
  const city = request.query.city;  //<<--gets from the query string
  const location = new Location (city, geoData);
  response.send(location);
}

function weatherHandler(request, response) {
  const weatherData = require('./data/posts.json');
  const weather = new Weather(weatherData);
  response.send(weather);
}

//Has to be after stuff loads too
app.use(notFoundHandler);

//Has to be after stuff loads
app.use(errorHandler);

app.listen(PORT, () => console.log(`App is listening on ${PORT}`)); //<<--these are tics not single quotes


//Route handlers
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


//Constructor functions
function Location (city, geoData) {  //<<--this is saying that it needs city and geoData to be able to run the constructor
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = parseFloat(geoData[0].lat);  //<<--used parseFloat because the info was a string and this will change to numbers
  this.longitude = parseFloat(geoData[0].lon);
}

function Weather (weatherData) {
  this.forecast = weatherData[3].title;
  this.time = weatherData[3].body;
  // this.latitude = latitude;
  // this.longitude = longitude;
}
