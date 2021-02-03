'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
// const superagent = require('superagent');  <<--only used in locations
const { json } = require('express');
const pg = require('pg');

const client = require('./modules/client');


const PORT = process.env.PORT;
const app = express();

app.use(cors()); //<<--need to have the inner parenthesis

app.get('/', (request, response) => {
  response.send('City Explorer Goes Here!');
});

app.get('/bad', (request, response) => {
  throw new Error('oops');
});

const locationHandler = require('./modules/locations');
const weatherHandler = require('./modules/weather');
const yelpHandler = require('./modules/yelp');

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/yelp', yelpHandler);
// app.get('/workouts', workoutsHandler);  //<<--comment out since it is breaking after refactoring due to the addHandler

// const workoutsModule = require('./modules/workouts');  //<<--commented out since it is breaking after refactoring due to the addHandler
// console.log('workoutsModule', workoutsModule);
// const { workoutsHandler, booksAddHandler } = workoutsModule;  //<<--this would have been workoutsAddHandler, but since I didn't change the name, I put in the current name




// const locationCache = {  //<<--an object for our cache
//   //when someone searches for CR, I want them to pull this information we already have instead "cedar rapids, ia": { display_name: 'Cedar Rapaids', lat: 5, lon: 1 }

// };

// function getLocationFromCache(city) {  //--<<this is a function using local storage to cache
//   const cacheEntry =  locationCache[city];  //<<--removed the return and changed to const and adding if statement if there is a cacheEntry
//   if(cacheEntry) {  //<<--if there is one, then return it
//     if(cacheEntry.cacheTime < Date.now() - 5000) {  //<<--if the cache time was before 5 seconds then use it
//       delete locationCache[city];  //<<--if greater than 5 seconds ago then delete it
//       return null;  //<<-- returning null is to say there is nothing in cache for the requested location and it will capture it from API and save to cache
//     }
//     return cacheEntry.location;
//   }
//   return null;
// }

// function setLocationInCache(city, location) {  //<<--this is a function using local storage to cache
//   locationCache[city] = {
//     cacheTime: new Date(),  //<<--added the date/time here to work with expiration
//     location,
//   };
//   console.log('Location cache update', locationCache);
// }


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


// const locationFromCache = getLocationFromCache(city);  //<<--before we go out to API, check the cache when using local storage functions
// if(locationFromCache) {  //<<--if we do, then send that
//   response.send(locationFromCache);
//   return;  //<<--if we return inside of here, that just means to stop executing this stuff and move on.  Or we could use an else { ... } below.
// }





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



//where books was originally

//Has to be after stuff loads too
app.use(notFoundHandler);

//Has to be after stuff loads
app.use(errorHandler);

//Make sure the server is listening for requests - after app.gets and app.uses and errorHandlers
client.connect()  //<<--keep in server.js
  .then(() => {
    console.log('PG connected!');

    app.listen(PORT, () => console.log(`App is listening on ${PORT}`)); //<<--these are tics not single quotes
  })
  .catch(err => {
    throw `PG error!:  ${err.message}`  //<<--these are tics not single quotes
  });



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
    notFound: true,
  });
}


//Constructor functions

// function Weather (weatherData) {  <<--does not work because the darksky file doesn't work for some reason
//   this.forecast = weatherData.summary;
//   this.time = weatherData.time;
// }
