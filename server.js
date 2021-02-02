'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { json } = require('express');
const pg = require('pg');

//Database Connection Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });

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
app.get('/yelp', yelpHandler);

//Books
app.get('/workouts', (request, response) => {
  const SQL = 'SELECT * FROM Workouts';
  client.query(SQL)
    .then(results => {
      let { rowCount, rows } = results;  //<<--same as if I had created variables to pull out the rowCount and rows from results ex.let rowCount = results.rowCount; and let rows = results.rows;

      if(rowCount === 0) {  //<<-- when thinking about the cacheing, this will go to the database and see if there is data that matches the request.  If so, then return the row info, if not, then go out to the API to get the info.
        response.send({
          error: true,
          message: 'Read more, dummy'
        });

      } else {
        response.send({
          error: false,
          message: rows
        })
      }

      console.log(results);

      response.json(results.rows);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
})

const locationCache = {  //<<--an oobject for our cache
  //when someone searches for CR, I want them to pull this information we already have instead "cedar rapids, ia": { display_name: 'Cedar Rapaids', lat: 5, lon: 1 }

};

function getLocationFromCache(city) {
  const cacheEntry =  locationCache[city];  //<<--removed the return and changed to const and adding if statement if there is a cacheEntry
  if(cacheEntry) {  //<<--if there is one, then return it
    if(cacheEntry.cacheTime < Date.now() - 5000) {  //<<--if the cache time was before 5 seconds then use it
      delete locationCache[city];  //<<--if greater than 5 seconds ago then delete it
      return null;  //<<-- returning null is to say there is nothing in cache for the requested location and it will capture it from API and save to cache
    }
    return cacheEntry.location;
  }
  return null;
}

// function setLocationInCache(city, location) {  //<<--using local storage
//   locationCache[city] = {
//     cacheTime: new Date(),  //<<--added the date/time here to work with expiration
//     location,
//   };
//   console.log('Location cache update', locationCache);
// }

function setLocationInCache(location) {
  const { search_query, formatted_query, latitude, longitude } = location
  const SQL = `
  INSERT INTO location2 (search_query, formatted_query, latitude, longitude)--<<--location2 is the name of the database
  VALUES ($1, $2, $3, $4)  --<<--will take in the results
  RETURNING *
  `;
  const parameters = [search_query, formatted_query, latitude, longitude];

  return client.query(SQL, parameters)  //<<super duper common error - promisey stuff inside of a function, return a promise that says we're done
    .then(result => {
      console.log('Cache Location', result);
    })
    .catch(err => {
      console.log('Failed to cache location', err);
    })
}

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

function locationHandler(request, response) {  //<<this handler works
  if (!process.env.GEOCODE_API_KEY) throw 'GEO_KEY not found';

  const city = request.query.city;
  const locationFromCache = getLocationFromCache(city);  //<<--before we go out to API, check the cache
  if(locationFromCache) {  //<<--if we do, then send that
    response.send(locationFromCache);
    return;  //<<--if we return inside of here, that just means to stop executing this stuff and move on.  Or we could use an else { ... } below.
  }

  const url = 'https://us1.locationiq.com/v1/search.php';
  superagent.get(url)
    .query({
      key: process.env.GEOCODE_API_KEY,
      q: city,
      format: 'json'
    })
    .then(locationResponse => {
      let geoData = locationResponse.body;
      // console.log(geoData);

      const location = new Location(city, geoData);

      setLocationInCache(location)  //<<--if we don't already have it, then save it too, BUT wait to find out and .then set
        .then(() => {
          console.log('Location has been cached', location);
          response.send(location);
        });

    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function weatherHandler(request, response) {  //<<--this handler works
  const city = request.query.search_query;  //<<--removing this and hardcoding the city name (ex. 'reno') worked, trying other, non-hardcoded ways
  const url = 'https://api.weatherbit.io/v2.0/forecast/daily';

  superagent.get(url)
    .query({
      city: city,
      key: process.env.WEATHER_API_KEY,
      days: 4
    })

    .then(weatherResponse => {
      let weatherData = weatherResponse.body; //this is what comes back from API in json
      console.log(weatherData);

      // const weatherResults = []; //<<--for returning an array of information - doesn't work
      // weatherData.daily.data.forEach(dailyWeather => {
      //   weatherResults.push(new Weather(dailyWeather));
      //})
      let dailyResults = weatherData.data.map(dailyWeather => {
        return new Weather(dailyWeather);
      })
      response.send(dailyResults);
    })

    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
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

function yelpHandler(request, response) {//<<--this handler works
  console.log(request.query);
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const restaurants = request.query.restaurants;
  const url = 'https://api.yelp.com/v3/businesses/search';

  superagent.get(url)
    .set('Authorization', 'Bearer ' + process.env.YELP_KEY)  //<<'Authorization is the name that yelp is requiring and "bearer" with the key included is the value.  Per yelp API directions:  "To authenticate API calls with the API Key, set the Authorization HTTP header value as Bearer API_KEY".  https://www.yelp.com/developers/documentation/v3/authentication
    .query({
      latitude: lat,
      longitude: lon,
      category: restaurants
    })

    .then(yelpResponse => {
      let yelpData = yelpResponse.body; //this is what comes back from API in json
      let yelpResults = yelpData.businesses.map(allRestaurants => {
        return new Restaurant(allRestaurants);
      })
      response.send(yelpResults);
    })

    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

//where books was originally

//Has to be after stuff loads too
app.use(notFoundHandler);

//Has to be after stuff loads
app.use(errorHandler);

//Make sure the server is listening for requests - after app.gets and app.uses and errorHandlers
client.connect()
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
function Location(city, geoData) { //<<--this is saying that it needs city and geoData to be able to run the constructor
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = parseFloat(geoData[0].lat); //<<--used parseFloat because the info was a string and this will change to numbers
  this.longitude = parseFloat(geoData[0].lon);
}

// function Weather (weatherData) {  <<--does not work because the darksky file doesn't work for some reason
//   this.forecast = weatherData.summary;
//   this.time = weatherData.time;
// }

function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = weatherData.datetime;
}


function Restaurant(yelpData) {
  this.name = yelpData.name;
  this. image_url = yelpData.image_url;
  this.rating = yelpData.rating;
  this.url = yelpData.url;
  this.price = yelpData.price;
}
