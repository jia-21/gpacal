const router = require('express').Router();
const modulesRouter = require('./modules');

router.use('/modules', modulesRouter);

module.exports = router;
