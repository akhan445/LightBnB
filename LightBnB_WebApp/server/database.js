const properties = require('./json/properties.json');
const users = require('./json/users.json');
/// Users

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
})

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  const queryString = `
    SELECT *
    FROM users
    WHERE email = $1;
  `;

  const queryParams = [email];

  return pool.query(queryString, queryParams)
  .then(res => res.rows[0])
  .catch(err => {
    console.log(err.message);
  });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  const queryString = `
    SELECT *
    FROM users
    WHERE id = $1;
  `;

  const queryParams = [id];

  return pool.query(queryString, queryParams)
  .then(res => res.rows[0])
  .catch(err => {
    console.log(err.message);
  });

}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {

  const queryString = `
    INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const queryParams = [user.name, user.email, user.password];

  return pool.query(queryString, queryParams)
  .then(res => res.rows[0])
  .catch(err => {
    console.log(err.message);
  });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);
  const queryString = `
    SELECT *
    FROM reservations
    JOIN properties
    ON properties.id = property_id
    WHERE guest_id = $1;
  `;

  const queryParams = [guest_id];

  return pool.query(queryString, queryParams)
  .then(res => res.rows)
  .catch(err => {
    console.log(err,message);
  });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  const queryParams = [];

  // Create the query by adding properties passed through options
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // Add all filters to an array and then join array with ' AND ' delimiter
  const whereClause = [];

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    whereClause.push(`city LIKE $${queryParams.length}`);
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    whereClause.push(`owner_id = $${queryParams.length}`);
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    whereClause.push(`cost_per_night >= $${queryParams.length}`);
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    whereClause.push(`cost_per_night <= $${queryParams.length}`);
  }

  // Where clause with all filters concatenated using AND
  if (whereClause.length) {
    queryString += `WHERE ${whereClause.join(' AND ')}`;
  } 

  queryString += `
  GROUP BY properties.id
  `;
  
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`;

  return pool.query(queryString, queryParams).then((res) => res.rows);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  const queryString = `
    INSERT INTO properties(title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;

  const queryParams = Object.values(property);

  return pool.query(queryString, queryParams).then((res) => res.rows);

}
exports.addProperty = addProperty;
