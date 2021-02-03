'use strict';

const superagent = require('superagent');


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

function Restaurant(yelpData) {
  this.name = yelpData.name;
  this. image_url = yelpData.image_url;
  this.rating = yelpData.rating;
  this.url = yelpData.url;
  this.price = yelpData.price;
}

module.exports = yelpHandler;