const { checkSchema } = require('express-validator');

module.exports = {
    signup: checkSchema({
        name:{
            trim: true,
            notEmpty: true,
            isLength:{
                options:{min:2}
            },
            errorMessage: 'Nome precisa ter pelomenos 2 caracteres!'
        },
        email: {
            isEmail: true,
            normalizeEmail: true,
            errorMessage: 'E-mail inválido!'
        },
        password: {
            isLength:{
                options:{min: 2}
            },
            errorMessage: 'Senha precisa ter pelomenos 2 caracteres'
        },
        state: {
            notEmpty: true,
            errorMessage: 'Estado não preenchido'
        }, 
    }),

    singin: checkSchema({
        email: {
            isEmail: true,
            normalizeEmail: true,
            errorMessage: 'E-mail inválido!'
        },
        password: {
            isLength:{
                options:{min: 2}
            },
            errorMessage: 'Senha precisa ter pelomenos 2 caracteres'
        }
    })
}