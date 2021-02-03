'use strict';

const superagent = require('superagent');


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

function Weather(weatherData) {  //<<--we don't export weather because it isn't needed by "anyone" else; we just need it inside of here
  this.forecast = weatherData.weather.description;
  this.time = weatherData.datetime;
}

module.exports = weatherHandler;