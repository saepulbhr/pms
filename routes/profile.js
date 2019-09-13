var express = require('express');
var router = express.Router();

const auth = require('../helper/auth')
const pat = "profile";

module.exports = (pool) => {

    router.get('/', auth, (req, res) => {
        let sql = `SELECT * FROM users where userid = ${req.session.user.userid}`;
        var path = "profile";
        pool.query(sql, (err, row) => {
            if (err) { console.log("error", err) }
            let Data = row.rows[0]

            res.render('profile/index', {
                data: req.session.user,
                Data,
                path,
                isAdmin: req.session.user
            })
        })
    });


    router.post('/update', (req, res) => {
        let pass = req.body.password;
        let posisi = req.body.role;
        let job = req.body.typejob ? true : false;

        let sql = `UPDATE users set  password = ${pass}, roles = '${posisi}', typejob = '${job}' where userid = ${req.session.user.userid}`;
        if (pass.trim() == '') {
            sql = `UPDATE users set  roles = '${posisi}', typejob = '${job}' where userid = ${req.session.user.userid}`;
        }

        pool.query(sql, (err) => {
            if (err) { console.log("error", err) }
            console.log(sql);
            // if(err){ throw err}
            res.redirect('/profile')
        })
    });

    return router
}