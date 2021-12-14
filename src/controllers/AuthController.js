const {validationResult, matchedData} = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const State = require('../models/State');
const mongoose  = require('mongoose');

module.exports = {
    singin: async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()})
            return;
        }

        const data = matchedData(req);

        const user = await User.findOne({email:data.email})
        if(!user){
            res.json({
                error: "E-mail e/ou senha invalidos!!"
            })
            return;
        }

        const match = await bcrypt.compare(data.password, user.passwordHash);
        if(!match){
            res.json({
                error: "E-mail e/ou senha invalidos!!"
            })
            return;
        }

        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        user.token = token;
        user.save();

        res.json({token});
    },

    signup: async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()})
            return;
        }

        const data = matchedData(req);

        const user = await User.findOne({
            email:data.email
        })

        if(user){
            res.json({
                error: {email:{msg: 'E-mail existente!!'}}
            })
            return;
        }
        
        if(mongoose.Types.ObjectId.isValid(data.state)){
            const stateItem = await State.findById(data.state);
            if(!stateItem){
                res.json({ 
                    error: {state:{msg:"Estado nao Existe!!"}}
                })
                return;
            }
        }else{
            res.json({ 
                error: {state:{msg:"Codigo invalido!!"}}
            })
            return;
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        
        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        const newUser = new User({
            name: data.name,
            email: data.email,
            passwordHash,
            token,
            state: data.state,

        });

        await newUser.save();

        res.json({token});

    }

}