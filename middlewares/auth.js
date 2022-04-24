const auth = (req,res,next) => {
  console.log('entered auth middleware')
  if(req.headers.authorization !== process.env.ACCESS_TOKEN) {
    res.status(401).send('unauthorized')
  } else next()
}

module.exports = auth