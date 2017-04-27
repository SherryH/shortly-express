var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  // links: function() {
  //   return this.hasMany(Link);
  // }
});

module.exports = User;



// var db = require('../config');
// var Link = require('./link.js');

// var Click = db.Model.extend({
//   tableName: 'clicks',
//   hasTimestamps: true,
//   link: function() {
//     return this.belongsTo(Link, 'linkId');
//   }
// });

// var Link = db.Model.extend({
//   tableName: 'urls',
//   hasTimestamps: true,
//   defaults: {
//     visits: 0
//   },
//   clicks: function() {
//     return this.hasMany(Click);
//   },

// module.exports = Click;
