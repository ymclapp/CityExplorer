'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { json } = require('express');

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

//Handlers used with dummy data
// function locationHandler(request, response) {  //<<--will only return longitude and latitude, but others (weather, yelp, etc.) will return an array similar to the darksky handler below.
//   const geoData = require('./data/geo.json');//<<--will end up changing to the API
//   const city = request.query.city;  //<<--gets from the query string
//   const location = new Location (city, geoData);
//   response.send(location);
// }

// function weatherHandler(request, response) {  //<<--junk for when he is using darksky.json - this works, but darksky doesn't
//   const weatherData = require('./data/darksky.json');
//   const weatherResults = [];  <<--for returning an array of information
//   weatherData.daily.data.forEach(dailyWeather => {
//     weatherResults.push(new Weather(dailyWeather));
//   });
//   // const weather = new Weather(weatherData);
//   response.send(weatherResults);
// }

function locationHandler(request, response) {
  if(!process.env.GEOCODE_API_KEY) throw 'GEO_KEY not found';

  const city = request.query.city;
  const url = 'https://us1.locationiq.com/v1/search.php';
  superagent.get(url)
    .query({
      key:  process.env.GEOCODE_API_KEY,
      q:  city,
      format:  'json'
    })
    .then(locationResponse => {
      let geoData = locationResponse.body;
      console.log(geoData);

      const location = new Location(city, geoData);
      response.send(location);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function weatherHandler(request, response) {
  const latitude = request.query.latitude;
  const longitude = request.query.longitude;
  const url = 'https://api.weatherbit.io/v2.0/forecast/daily';
  superagent.get(url)
    .query({
      longitude: longitude,
      latitude: latitude,
      key: process.env.WEATHER_API_KEY,
      days: 4
    })

    .then(weatherResponse => {
      let weatherData = weatherResponse.body.data; //this is what comes back from API in json
      console.log(weatherData);

      const weatherResults = []; //<<--for returning an array of information
      weatherData.daily.data.forEach(dailyWeather => {
        weatherResults.push(new Weather(dailyWeather));
      })

        .catch(err => {
          console.log(err);
          errorHandler(err, request, response);
        })
      }
    

      // const weather = new Weather(weatherData);
      // response.send(weatherResults);
      // }

      // function weatherHandler(request, response) {  //<<--this appears to work manually.  Need to get to work in City Exploerer and need to get the forEach to work.
      //   const city = request.query.city;
      //   const url = 'https://api.weatherbit.io/v2.0/forecast/daily';
      //   superagent.get(url)
      //     .query({
      //       city:  city,
      //       key: process.env.WEATHER_API_KEY,
      //       days: 4
      //     })
      //     .then(weatherResponse => {
      //       let weatherData = weatherResponse.body.data;  //this is what comes back from API in json
      //       console.log(weatherData);

      //       const weather = new Weather(city, weatherData);
      //       response.send(weather);
      //     })
      //     .catch(err => {
      //       console.log(err);
      //       errorHandler(err, request, response);
      //     });
      // }



      //Has to be after stuff loads too
      app.use(notFoundHandler);

      //Has to be after stuff loads
      app.use(errorHandler);

      app.listen(PORT, () => console.log(`App is listening on ${PORT}`)); //<<--these are tics not single quotes


      //Route handlers
      function errorHandler(error, request, response, next) {
        console.error(error);
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
      function Location (city, geoData) { //<<--this is saying that it needs city and geoData to be able to run the constructor
        this.search_query = city;
        this.formatted_query = geoData[0].display_name;
        this.latitude = parseFloat(geoData[0].lat); //<<--used parseFloat because the info was a string and this will change to numbers
        this.longitude = parseFloat(geoData[0].lon);
      }

      // function Weather (weatherData) {  <<--does not work because the darksky file doesn't work for some reason
      //   this.forecast = weatherData.summary;
      //   this.time = weatherData.time;
      // }

      function Weather (dailyWeather) {
        this.forecast = dailyWeather.summary;
        this.time = dailyWeather.datetime;
      }
