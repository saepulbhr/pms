var express = require('express');
var router = express.Router();

const auth = require('../helper/auth')
module.exports = (pool) => {
  var path = "user";
  // ============================= Router Users ============================= 
  router.get('/', auth, (req, res) => {
    const { cuserid, userid, cemail, email, cname, name, ctype, type, croles, roles } = req.query;
    let temp = []
    const url = (req.url == '/') ? `?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 2;
    let offset = (page - 1) * limit
    console.log(req.url)
    

    if (cuserid && userid) {
      temp.push(`userid = ${userid}`)
    }

    if (cemail && email) {
      temp.push(`email = "${email}"`)
    }

    if (cname && name) {
      temp.push(`name = ${name} `)
    }

    if (ctype && type) {
      temp.push(`typejob = ${type}`)
    }

    if (croles && roles) {
      temp.push(`roles = '${roles}'`)
    }

    let sql = `SELECT COUNT(*) as total FROM users`
    
    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)
      
      let sql = `SELECT * FROM users`;
      if (temp.length > 0) {
        sql += ` Where ${temp.join(" AND ")}`
      }
      
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
      
      pool.query(sql, (err, row) => {
        console.log(sql)
        pool.query(`SELECT useroption FROM users WHERE userid = ${req.session.user.userid}`, (err, data) => {
          res.render('users/index', {
            data: row.rows,
            query: req.query,
            isAdmin: req.session.user,
            option : data.rows[0].useroption,
            path,
            pages : pages,
            current:page,
            url:url
          });
        })
      })
    })
  });

  // ============================= Router Add Users ============================= 
  router.get('/add', auth, (req, res) => {
    res.render('users/add', { path, isAdmin: req.session.user })
  })

  // ============================= Router Save New Users =============================
  router.post('/save', (req, res) => {
    const { email, password, firstname, lastname, position, type } = req.body;
    let sql = `INSERT INTO users(email, password, firstname, lastname, roles, typejob, isadmin)VALUES('${email}', '${password}', '${firstname}', '${lastname}', '${position}', ${type}, false)`;
    pool.query(sql, (err) => {
      res.redirect('/users')
    })
  });

  // ============================= Router Edit Users =============================
  router.get('/edit/:userid', auth, (req, res) => {
    let sql = `SELECT * FROM users WHERE userid = ${req.params.userid}`
    pool.query(sql, (err, data) => {
      if (err) { console.error('NOT FOUND') }
      res.render('users/edit', {
        data: data.rows[0],
        path,
        isAdmin: req.session.user
      })
    });
  });

  // ============================= Router Update Users =============================
  router.post('/update/:userid', (req, res) => {
    const {email, password, firstname, lastname, position, typejob} = req.body;
    let sql =`UPDATE users SET email = '${email}', password ='${password}', firstname = '${firstname}', lastname = '${lastname}', roles = '${position}', typejob = ${typejob} WHERE userid = ${req.params.userid}`
    if(password.trim() == ''){
       sql = `UPDATE users SET email = '${email}', firstname = '${firstname}', lastname = '${lastname}', roles = '${position}', typejob = ${typejob} WHERE userid = ${req.params.userid}`
    }
    
    console.log(sql)
    pool.query(sql, (err) => {
      if(err){ console.log('FAILED')}
      res.redirect('/users')
    })
  })

  // ============================= Router Delete Users ============================= 
  router.get('/delete/:userid', auth, (req, res) => {
    let sql = `DELETE FROM users WHERE userid = ${req.params.userid}`;
    pool.query(sql, (err) => {
      if (err) { console.error('Remove Failed') }
      res.render('users/index', {isAdmin: req.session.user})
    })
  });


  // ============================= Router Option Users ============================= 
  router.post('/option', (req, res) => {
    const { idoption, emailoption, nameoption, typeoption, roleoption } = req.body;

    let sql = `UPDATE users SET useroption = '${JSON.stringify(req.body)}' WHERE userid = ${req.session.user.userid}`;
    pool.query(sql, (err) => {
      res.redirect('/users')
    })
  });

  return router;
}
