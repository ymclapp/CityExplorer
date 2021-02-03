'use strict';

const client = require('./client');


const workoutsHandler = (request, response) => {
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

  //I did not originally create this because he said not to do it this way.  This is theh books add so that you can see it and how a multiple handler is exported from module
//   const booksAddHandler = (request, response) => {
//     let { title, author, genre } = request.query; // destructuring
//     let SQL = `
//       INSERT INTO Books (title, author, genre)
//       VALUES($1, $2, $3)
//       RETURNING *
//     `;
//     let SQLvalues = [title, author, genre];
//     client.query(SQL, SQLvalues)
//       .then(results => {
//         response.send(results);
//       })
//       .catch(err => {
//         console.log(err);
//         errorHandler(err, request, response);
//       });
  
//     /* NEVER EVER EVER DO THIS
//     `
//       INSERT INTO Books (title, author, genre)
//       VALUES('${title}', '${author}', '${genre}')
//     `;
//     // SQL Injection
//     // title = "', 'whatever', 'whatever'); DELETE FROM Books; --"
//     */
//   }
  
//   module.exports = {
//     booksHandler,
//     booksAddHandler,
//   };

module.exports = workoutsHandler;