module.exports = (fn) => {
  return (req, res) => {
    fn(req, res).catch((err) => {
      console.log(err);
      res.status(500).send('Server error');
    });
  };
};
