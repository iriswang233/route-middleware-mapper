const isAdmin = (req, res, next) => {
  console.dir('isAdmin');
  next('router');

}
module.exports = isAdmin;