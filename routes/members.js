var express = require('express');
var router = express.Router();

const auth = require('../helper/auth')

module.exports = (pool) => {
  // ============================= Router Login ============================= 
  router.get('/', (req, res) => {
    let sql = `SELECT * FROM users`;
    pool.query(sql, (err, row) => {
        res.render('member/index', {data: row.rows, isAdmin: req.session.user});
        
    })
  });

  return router;
}
