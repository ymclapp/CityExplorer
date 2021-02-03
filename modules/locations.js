'use strict';


const client = require('./client');
const superagent = require('superagent');


function getLocationFromCache(city) {  //<<--this is the function for using the database to cache
  const SQL = `  --<<--these are tic marks not single quotes
    SELECT * 
    FROM location2
    WHERE search_query = $1
    LIMIT 1  --<<--brings back only one of the rows for that city
    `;
  const parameters = [city];
  
  return client.query(SQL, parameters);
}
  
function setLocationInCache(location) {  //<<--this is a function for using the database to cache
  const { search_query, formatted_query, latitude, longitude } = location
  const SQL = `  --<<--these are tic marks not single quotes
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
  
function locationHandler(request, response) {  //<<this handler works
  if (!process.env.GEOCODE_API_KEY) throw 'GEO_KEY not found';
  
  const city = request.query.city;
  
  getLocationFromCache(city)
    .then(result => {
      console.log('Location from cache', result.rows)
      let { rowCount, rows} = result;
      if (rowCount > 0) {
        response.send(rows[0]);
      }
      else {
        return getLocationFromAPI(city, response);  //<<--have to pass the response so that it will get picked up by the getLocationFromAPI response.send(location)
      }
    })
}

function getLocationFromAPI(city, response) {
  console.log('Requesting location from API', city);
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
function Location(city, geoData) { //<<--this is saying that it needs city and geoData to be able to run the constructor
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = parseFloat(geoData[0].lat); //<<--used parseFloat because the info was a string and this will change to numbers
  this.longitude = parseFloat(geoData[0].lon);
}


module.exports = locationHandler;
