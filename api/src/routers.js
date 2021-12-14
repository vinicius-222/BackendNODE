const express = require('express');
const router = express.Router();
const Auth = require('./middlewares/Auth');
const AuthValidator = require('./validators/AuthValidator');
const UserValidator = require('./validators/UserValidator');

const UserController = require('./controllers/UserController');
const AuthController = require('./controllers/AuthController');
const AdsController = require('./controllers/AdsController');

router.get('/states', UserController.getStates);

router.post('/user/singin', AuthValidator.singin, AuthController.singin);
router.post('/user/signup', AuthValidator.signup, AuthController.signup);

router.get('/user/me', Auth.private, UserController.info);
router.put('/user/me', UserValidator.editAction,  Auth.private, UserController.editAction);

router.get('/categories', AdsController.getCategories);

router.post('/ad/add', Auth.private, AdsController.addAction);
router.get('/ad/list', AdsController.getList);
router.get('/ad/:id/:other', AdsController.getItem); 
router.post('/ad/:id', Auth.private, AdsController.editAction);
router.delete('/ad/:id', Auth.private, AdsController.deleteAction);


module.exports = router