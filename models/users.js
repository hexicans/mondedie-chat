"use strict";
var Promise = require('bluebird');

/*
 * Users - model
 */
var Users = function(redis) {
  this.db = redis;
}

/*
 * Ajoute un utilisateur à la liste des membres connectés
 */
Users.prototype.add = function(user) {
  var userkey = 'users:profiles:' + user.name.toLowerCase();
  this.db.hmset(userkey, user);
  this.db.sadd('users:connected', userkey);
}

/*
 * Ajoute un utilisateur à la liste des membres bannis
 */
Users.prototype.ban = function(username) {
  this.db.sadd('users:banned', 'users:profiles:' + username.toLowerCase());
}

/*
 * Supprime un utilisateur de la liste des membres bannis
 */
Users.prototype.unban = function(username) {
  this.db.srem('users:banned', 'users:profiles:' + username.toLowerCase());
}

/*
 * Retourne la liste des membres connectés
 */
Users.prototype.list = function() {
  return list(this.db, 'users:connected');
}

/*
 * Retourne la liste des membres bannis
 */
Users.prototype.banlist = function() {
  return list(this.db, 'users:banned');
}

/*
 * Supprime un utilisateur de la liste des membres connectés
 */
Users.prototype.remove = function(username) {
  this.db.srem('users:connected', 'users:profiles:' + username.toLowerCase());
}

/*
 * Vérifie si l'utilisateur est déjà connecté
 */
Users.prototype.exist = function(username) {
  var exist = false;
  return list(this.db, 'users:connected')
  .map(function(user) {
    if(user.name.toLowerCase() == username.toLowerCase())
      exist = true;
  })
  .then(function() {
    return Promise.resolve(exist);
  });
}

/*
 * Récupère l'identificateur du socket de l'utilisateur
 */
Users.prototype.getUserSocket = function(username) {
  return this.db.hgetallAsync('users:profiles:' + username.toLowerCase())
  .then(function(user) {
    return user ? user.socket : Promise.reject();
  });
}

/*
 * Vérifie si l'utilisateur est banni
 */
Users.prototype.banned = function(username) {
  var exist = false;
  return list(this.db, 'users:banned')
  .map(function(user) {
    if(user.name.toLowerCase() == username.toLowerCase())
      exist = true;
  })
  .then(function() {
    return Promise.resolve(exist);
  });
}

/*
 * Retourne une liste d'utilisateurs sous forme d'objet
 */
var list = function(client, key) {
  return client.smembersAsync(key)
  .map(function(user) {
    return client.hgetallAsync(user)
  })
  .finally(function(users) {
    return users;
  });
};

module.exports = Users;
