const {validationResult, matchedData} = require('express-validator');
const mongoose  = require('mongoose');
const bcrypt = require('bcrypt');

const User =  require('../models/User');
const States = require('../models/State');
const Ads = require('../models/Ad');
const Categoty = require('../models/Category');
const State = require('../models/State');

module.exports = {
    getStates: async (req, res) => {
        let states = await States.find();
        res.json({states});
    },

    info: async (req, res)=> {
        const user = await User.findOne({token:req.query.token});
        const state = await States.findById(user.state); 
        const ads = await Ads.find({idUser: user._id.toString()});

        let adsList = [];

        for(let i in ads){
            const cat = await Categoty.findById(ads[i].category)

            adsList.push({...adsList[i], category: cat.name});
        }

        res.json({
            name: user.name,
            email: user.email,
            state: state.name,
            ads: adsList
        });
    },

    editAction:async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.json({error: errors.mapped()})
            return;
        }

        const data = matchedData(req);
        let updates = {};

        if(data.name){
            updates.name = data.name
        }

        if (data.email){
            const emailCheck = await User.findOne({email: data.email});
            if(emailCheck){
                res.json({
                    Error: "Email existente!!"
                })
                return;
            }
            updates.email = data.email;
        }


        if (data.state){
            if(mongoose.Types.ObjectId.isValid(data.state)){
                const stateCheck = await State.findById(data.state);
                if(!stateCheck){
                    res.json({
                        Error: "Estado nao existe!"
                    })
                    return;
                }
                updates.state = data.state;
            }else{
                res.json({
                    Error: "Codigo do estado invalido!"
                })
                return;
            }
        }

        if(data.password){
            updates.passwordHash = await bcrypt.hash(data.password, 10);
        }


        await User.findOneAndUpdate({token: data.token}, {$set: updates});

        res.json({data});
    },

    getUserDetails: async (req, res)=>{
        let details = await User.getDetails(req);
        res.json({details});
    },

    getUserRepos: async (req, res)=>{
        let repos = await User.getRepos(req);
        res.json({repos});
    }
};