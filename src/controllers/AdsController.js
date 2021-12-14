const {v4: uuid} = require('uuid');
const jimp = require('jimp');
const mongoose = require('mongoose');

const Category = require('../models/Category');
const Ads = require('../models/Ad');
const User = require('../models/User');
const State = require('../models/State');
const { update } = require('../models/User');
require('dotenv').config();

const addImage = async (buffer) =>{
    let newName = `${uuid()}.jpg`;
    let tmpImg = await jimp.read(buffer);
    tmpImg.cover(500, 500).quality(80).write(`./public/assets/media/${newName}`);
    
    return newName;
}

module.exports = {
    getCategories: async(req, res) => {
        const cats = await Category.find();
        
        let categories = [];

        for(let i in cats){
            categories.push({
                ...cats[i]._doc, 
                img: `${process.env.BASE}/assets/images/${cats[i].slug}.png`
            })
        }

        res.json({categories});
    },

    addAction: async(req, res) => {
        let {title, price, priceneg, desc, cat, token} = req.body;
        const user = await User.findOne({token}).exec();

        if(!title || !cat) {
            res.json({Error:"Titulo e/ou Categorias nao foram preenchidos!!"});
            return;
        }

        if(cat.length < 12){
            res.json({error: "ID de Categoria Invalido!!"});
            return;
        }

        if(mongoose.Types.ObjectId.isValid(cat)){
            const c = await Category.findById(cat).exec();
            if(!c){
                res.json({error: "Categoria Inexistente!!"});
                return;
            }
        }else{
            res.json({error: "Categoria Inexistente!!"});
            return;
        }

        if(price){
            price = price.replace('.','').replace(',','.').replace('R$','');
            price = parseFloat(price);
        }else{
            price = 0;
        }

        const newAdd = new Ads();
        newAdd.status = true;
        newAdd.idUser = user._id;
        newAdd.state = user.state;
        newAdd.category = cat;
        newAdd.dateCreated = new Date();
        newAdd.title = title;
        newAdd.price = price;
        newAdd.priceNegotiable = (priceneg=='true') ? true : false;
        newAdd.description = desc;
        newAdd.views = 0;

        if(req.files && req.files.img){
            if(req.files.img.length == undefined){
                if(['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img.mimetype)){
                    let url = await addImage(req.files.img.data);
                    newAdd.images.push({
                        url,
                        default: false
                    })
                }
            }else{
                for(let i=0; i < req.files.img.length; i++){
                    if(['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img[i].mimetype)){
                        let url = await addImage(req.files.img[i].data);
                        newAdd.images.push({
                            url,
                            default: false
                        })
                    }
                }
            }
        }
        if(newAdd.images.length > 0 ){
            newAdd.images[0].default = true;
        }

        const info = await newAdd.save();
        res.json({id: info._id});
    },

    getList: async(req, res) => {
        let { sort = 'asc', offset = 0, limit = 8, q, cat, state } = req.query;
        let filters = {status: true};
        let total = 0;
        
        if(q){
            filters.title = {'$regex': q, '$options':'i'};
        }

        if(cat){
            const c = await Category.findOne({slug: cat});
            if(c){
                filters.category = c._id.toString();
            }else{
                res.json({
                    Error:"Categoria nao existe"
                })
                return;
            }
        }

        if(state){
            const s = await State.findOne({name:state}).exec();
            if(s){
                filters.state = s._id.toString();
            }
        }
        
        const adsTotal = await Ads.find(filters).exec();
        total = adsTotal.length;

        const adsData = await Ads.find(filters)
            .sort({datecreated: (sort=='desc'?-1:1)})
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .exec();
        let ads = [];
        for(let i in adsData){
            let image;

            let defaultImg = adsData[i].images.find(e => e.default);
            if(defaultImg){
                image = `${process.env.BASE}/assets/media/${defaultImg.url}`;
            }else{
                image = `${process.env.BASE}/assets/media/default.jpg`;
            }

            ads.push({
                id: adsData[i]._id,
                title: adsData[i].title,
                price: adsData[i].price,
                priceNegotiable: adsData[i].priceNegotiable,
                image
            })
        }
        res.json({ads, total});
    },

    getItem: async(req, res) => {
        let {id, other = false} = req.params;

        if(!id){
            res.json({Error:"Sem produto"});
            return;
        }

        if(id.length < 12){
            res.json({Error:"ID Invalido"});
            return;
        }

        const ad = await Ads.findById(id);
        if(!ad){
            res.json({Error:"Produto Inexistente!"})
            return;
        }

        ad.views++;
        await ad.save();

        let images = [];
        for(let i in ad.images){
            images.push({url:`${process.env.BASE}/assets/media/${ad.images[i].url}`});
        }

        let category = await Category.findById(ad.category).exec();
        let userInfo = await User.findById(ad.idUser).exec();
        let stateInfo = await State.findById(ad.state).exec();

        let others = [];
        if(other == 'true'){
            const otherData = await Ads.find({status: true, idUser: ad.idUser}).exec();

            for(let i in otherData){
                let image = `${process.env.BASE}/assets/media/default,jpg`;

                let defaultImg = otherData[i].images.find(e => e.default)
                if(defaultImg){
                    image = `${process.env.BASE}/assets/media/${defaultImg.url}`;
                }

                if(otherData[i]._id.toString() != ad._id.toString()){
                    others.push({
                        id: otherData[i]._id,
                        title: otherData[i].title,
                        price: otherData[i].price,
                        priceNegotiable: otherData[i].priceNegotiable,
                        description: otherData[i].description,
                        datecreated: otherData[i].datecreated,
                        image
                    })
                }
            }
        }

        res.json({
            id: ad._id,
            title: ad.title,
            price: ad.price,
            priceNegotiable: ad.priceNegotiable,
            description: ad.description,
            datecreated: ad.datecreated,
            views: ad.views,
            images,
            category,
            userInfo:{
                name: userInfo.name,
                email: userInfo.email
            },
            stateName: stateInfo.name,
            others
        })
    },

    editAction: async(req, res) => {
        let { id } = req.params;
        let { title, price, priceneg, description, datecreated, status, cat, state, images, token} = req.body;
        if(!id){
            res.json({Error:"Produto Inexistente!"});
            return;
        }

        if(id.length < 12){
            res.json({Error: "ID Inexistente!"});
            return;
        }

        const ad = await Ads.findById(id).exec();
        if(!ad){
            res.json({Error:"Anuncio inexistente!!"});
            return;
        }

        const user = await User.findOne({token}).exec();
        if(user._id.toString() !== ad.idUser){
            res.json({Error: "Este anuncio nao e seu!!"});
            return;
        }


        let updates = {};

        if(title){
            updates.title = title;
        }

        if(price){
            price = price.replace('.','').replace(',','.').replace('R$','');
            price = parseFloat(price);
        }else{
            price = 0;
        }

        if(priceneg){
            updates.priceNegotiable = priceneg;
        }

        if(description){
            updates.description = description;
        }

        if(datecreated){
            updates.datecreated = datecreated;
        }

        if(status){
            updates.status = status;
        }

        if(cat){
            const category = await Category.findOne({slug: cat}).exec();
            if(!category){
                res.json({Error:"Categoria Inexistente!!"});
                return;
            }
            updates.category = category._id.toString();
        }

        if(state){
            const s = await State.findOne({name:state})
            if(!s){
                res.json({Error:"Estado Inexistente!!"});
                return;
            }
            updates.state = s._id.toString();
        }

        if(images){
            updates.images = images
        }

        await Ads.findByIdAndUpdate(id, {$set: updates});

        if(req.files && req.files.img){
            const adi = await Ads.findById(id);

            if(req.files.img.length == undefined){
                if(['image/jpg', 'image/jpeg', 'image/png'].includes(req.files.img.mimetype)){
                    let url = await addImage(req.files.img.data);
                    adi.images.push({
                        url,
                        default: false
                    });
                }
            }else{
                for(let i = 0; i < req.files.img.length; i++){
                    if(['image/jpg', 'image/jpeg', 'image/png'].includes(req.files.img.mimetype)){
                        let url = await addImage(req.files.img[i].data);
                        adi.images.push({
                            url,
                            default: false
                        });
                    }
                }
            }
            adi.images = [...adi.images];
            await adi.save();
        }

        res.json({Error:""});

    },

    deleteAction: async(req, res) => {
        let { id } = req.params;

        if(!id){
            res.json({error: "ID Inexistente!!"});
            return;
        }

        if(mongoose.Types.ObjectId.isValid(id)){
            const ads = await Ads.findById(id).exec();
            if(!ads){
                res.json({error: "Anuncio Inexistente!!"});
                return;
            }
        }else{
            res.json({error: "Anuncio Inexistente!!"});
            return;
        }

        const ads = await Ads.deleteOne({_id:id});
        res.json({error: ""})
    }
    
}