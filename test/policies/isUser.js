const isUser = (req, res) => {
  console.dir('isUser is called');
  // res.headersSent = true;
  console.dir(res);
  return res.status(200).json('isUser is called');
}
module.exports = {
  isUser
};