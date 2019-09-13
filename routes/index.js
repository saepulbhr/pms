var express = require('express');
var router = express.Router();

const auth = require('../helper/auth')

module.exports = (pool) => {
  // ============================= Router Login =============================
  router.get('/', function (req, res, next) {
    res.render('login', { title: 'Project Management System', isAdmin: req.session.user,  loginInfo: req.flash("loginInfo") });
  });


  // ============================= Router Login ============================= 
  router.post('/login', function (req, res, next) {
    const { email, password } = req.body;

    let sql = `SELECT * FROM public.users where email = '${email}'`;
    pool.query(sql).then(row => {
      console.log(row.rows);
      
      if (row.rows[0].email != null) {
        console.log(row.rows[0].password, password);
        
        if (row.rows[0].password == password) {
          req.session.user = row.rows[0]
          
          res.redirect('/projects')
        } else {
          req.flash('loginInfo', 'email atau password salah')
          res.redirect('/')
        }
      } else {
        res.redirect('/')
      }
    }).catch(err => {
      console.log(err);

    })

  });

  


  // ============================= Router Logut =============================
  router.get('/logout', auth, (req, res) => {
    req.session.destroy(function (err) {
      if (err) {
        console.log('err')
      } else {
        res.redirect('/')
      }
    })
  });


  return router;
}
