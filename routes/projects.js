var express = require('express');
var router = express.Router();

const auth = require('../helper/auth')
const util = require('../helper/util')
const pathnode = require('path')

var moment = require('moment')
moment().format()

module.exports = (pool) => {

  var path = "/projects";

  // ============================= Router Home Redirect /projects =============================
  router.get('/', auth, function (req, res, next) {

    const { cprojectid, projectid, cname, name, cmember, member } = req.query;

    const url = (req.url == '/') ? `/?page=1` : req.url

    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit

    let params = [];


    if (cprojectid && projectid) {
      params.push(`projects.projectid = ${projectid}`);
    }

    if (cname && name) {
      params.push(`projects.name = '${name}'`)
    }

    if (cmember && member) {
      params.push(`members.userid = ${member}`)
    }

    let sql = `SELECT COUNT(id) as total FROM (SELECT DISTINCT projects.projectid AS id FROM projects LEFT JOIN members ON projects.projectid = members.projectid`;

    if (params.length > 0) {
      sql += ` WHERE ${params.join(" AND ")}`
    }

    sql += `) AS projectmember`;

    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)

      sql = `SELECT DISTINCT projects.projectid, projects.name FROM projects LEFT JOIN members ON projects.projectid = members.projectid`

      if (params.length > 0) {
        sql += ` WHERE ${params.join(" AND ")}`
      }

      sql += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`

      let subquery = `SELECT DISTINCT projects.projectid FROM projects LEFT JOIN members ON projects.projectid = members.projectid`

      subquery += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`

      let sqlMembers = `SELECT projects.projectid, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects LEFT JOIN members ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE projects.projectid IN (${subquery})`


      pool.query(sql, (err, projectData) => {
        pool.query(sqlMembers, (err, memberData) => {

          projectData.rows.map(projects => {

            projects.members = memberData.rows.filter(member => { return member.projectid == projects.projectid }).map(item => item.fullname)
          })

          let sqlusers = `SELECT * FROM users`;
          let sqloption = `SELECT projectoption  FROM users  WHERE userid = ${req.session.user.userid}`;

          pool.query(sqlusers, (err, data) => {
            pool.query(sqloption, (err, option) => {
              // console.log(typeof option.rows[0].projectoption);

              res.render('project/index', {
                data: projectData.rows,
                query: req.query,
                users: data.rows,
                current: page,
                pages: pages,
                url: url,
                option: option.rows[0].projectoption,
                path,
                isAdmin: req.session.user
              })
            })
          })
        })
      })
    })
  });

  // ============================= Router Option =============================
  router.post('/option', auth, (req, res) => {
    let sql = `UPDATE users SET projectoption = '${JSON.stringify(req.body)}' WHERE userid = ${req.session.user.userid}`;
    pool.query(sql, (err, data) => {
      res.redirect('/projects')
    })
  });

  // ============================= Router Add =============================
  router.get('/add', auth, (req, res) => {
    let sql = `select * from users`;
    pool.query(sql, (err, row) => {
      res.render('project/add', {
        data: row.rows,
        path,
        isAdmin: req.session.user
      })
    })
  });

  // ============================= Router Save /projects =============================
  router.post('/save', (req, res) => {
    // const {namaproject, member}=req.body;

    let sql = `insert into projects(name)values('${req.body.namaproject}');`
    pool.query(sql, (err) => {
      if (err) { console.log('error') }
      let view = `SELECT projectid FROM projects order by projectid desc limit 1`;
      pool.query(view, (err, row) => {
        let temp = []
        let idProject = row.rows[0];

        if (typeof req.body.member == 'string') {
          temp.push(`(${req.body.member}, ${idProject})`)
        } else {
          for (let i = 0; i < req.body.member.length; i++) {
            temp.push(`(${req.body.member[i]}, ${idProject})`)
          }
        }

        let sqlsave = `INSERT INTO public.members (userid, role, projectid) values ${temp.join(',')}`;
        pool.query(sqlsave, (err) => {
          if (err) { console.error("Error", err) }
          res.redirect('/projects')
        })
      })
    })
  })

  // ============================= Router Edit /projects =============================
  router.get('/edit/:projectid', auth, (req, res) => {
    pool.query(`SELECT members.userid, projects.projectid FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON members.userid = users.userid WHERE projects.projectid = ${req.params.projectid}`, (err, data) => {
      pool.query(`select projects.name, projects.projectid from projects left join members on members.projectid = projects.projectid where projects.projectid =${req.params.projectid}`, (err, nmmember) => {
        pool.query(`SELECT * FROM users`, (err, user) => {
          res.render('project/edit', {
            name: nmmember.rows[0].name,
            projectid: nmmember.rows[0].projectid,
            members: data.rows.map(item => item.userid),
            users: user.rows,
            isAdmin: req.session.user,
            path
          })
        })
      })
    })
  });

  // ============================= Router Update /projects =============================
  router.post('/update/:projectid', (req, res) => {
    const { name, member } = req.body;
    let id = req.params.projectid;

    let sql = `UPDATE projects SET name = '${name}' WHERE projectid = ${req.params.projectid}`;
    pool.query(sql, (err) => {
      pool.query(`DELETE FROM members WHERE projectid = ${req.params.projectid}`, (err) => {
        let temp = []
        if (typeof req.body.member == 'string') {
          temp.push(`(${req.body.member}, ${id})`)
        } else {
          for (let i = 0; i < member.length; i++) {
            temp.push(`(${member[i]}, ${id})`)
          }
        }

        let input = `INSERT INTO members (userid, role,  projectid)VALUES ${temp.join(",")}`;
        pool.query(input, (err) => {
          res.redirect('/projects')
        })
      })
    });
  });

  // ============================= Router Delete /projects =============================
  router.get('/delete/:projectid', auth, (req, res) => {
    let sql = `delete from members where projectid = ${req.params.projectid}`;
    pool.query(sql, (err) => {
      pool.query(`delete from projects where projectid = ${req.params.projectid}`, (err) => {
        res.redirect('/projects')
      })
    })
  })

  // ============================= Router Issues ============================= 
  router.get('/issues/:projectid', auth, (req, res) => {
    const pathside = "issues";
    const { cid, issueid, csubject, subject, ctracker, tracker } = req.query;
    let temp = []
    const url = (req.url == `/issues/${req.params.projectid}`) ? `/issues/${req.params.projectid}/?page=1` : req.url

    const page = req.query.page || 1;
    const limit = 2;
    const offset = (page - 1) * limit

    if (cid && issueid) {
      temp.push(`issueid = ${issueid}`)
    }

    if (csubject && subject) {
      temp.push(`subject = '${subject}'`)
    }

    if (ctracker && tracker) {
      temp.push(`tracker = '${tracker}'`)
    }
    let sql = `SELECT count(*) as total FROM issues WHERE projectid = ${req.params.projectid}`
    pool.query(sql, (err, count) => {
      let total = count.rows[0].total;
      let pages = Math.ceil(total / limit);

      sql = `SELECT * FROM issues WHERE projectid = ${req.params.projectid}`;
      if (temp.length > 0) {
        sql += ` AND ${temp.join(" AND ")}`
      }

      sql += ` ORDER BY issues.projectid LIMIT ${limit} OFFSET ${offset}`

      pool.query(sql, (err, row) => {
        pool.query(`SELECT issueoption  FROM users  WHERE userid = ${req.session.user.userid}`, (err, option) => {
          if (err) { console.log('Not Found') }
          res.render('issues/index', {
            data: row.rows,
            option: option.rows[0].issueoption,
            projectid: req.params.projectid,
            query: req.query,
            pages: page,
            current: pages,
            url: url,
            pathside,
            path,
            isAdmin: req.session.user,
            moment
          });
        })
      })
    })
  });

  // ============================= Router Issues Add ============================= 
  router.get('/addIssues/:projectid', auth, (req, res) => {
    const pathside = "issues";
    let sql = `SELECT projects.projectid, users.userid, users.firstname, users.lastname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON members.userid = users.userid WHERE members.projectid = ${req.params.projectid}`

    pool.query(sql, (err, data) => {
      res.render('issues/add', {
        data: data.rows,
        projectid: req.params.projectid,
        path, pathside,
        isAdmin: req.session.user
      })
    })
  });

  // ============================= Router Issues Save============================= 
  router.post('/saveIssues/:projectid', auth, (req, res) => {
    const { tracker, subject, description, status, priority, assignee, startdate, duedate, file, estimatedtime, progres } = req.body;
    let upload = req.files.file;
    let filename = upload.name.toLowerCase().replace('', Date.now());

    let sql = `INSERT INTO issues(tracker, subject, description, status, priority, startdate, duedate, estimatedtime, done, file, assignee, projectid, createddate)
    VALUES ('${tracker}', '${subject}', '${description}', '${status}', '${priority}', '${startdate}', '${duedate}', ${estimatedtime}, ${progres}, '${filename}', ${assignee}, ${req.params.projectid}, now())`
    if (req.files) {
      upload.mv(pathnode.join(__dirname, `../public/images/${filename}`)), function (err) {
        if (err) console.log(err)
      }
    }

    pool.query(sql, (err) => {
      if (err) { console.error('Not Found') }
      res.redirect(`/projects/issues/${req.params.projectid}`)
    });
  });

  // ============================= Router Issues Edit============================= 
  router.get('/issues/editissue/:projectid/:issueid', auth, (req, res) => {
    const pathside = "issues";
    let sql = `SELECT * FROM issues WHERE issueid = ${req.params.issueid}`;
    let sqluser = `SELECT users.userid, users.firstname, users.lastname FROM users`
    pool.query(sql, (err, data) => {
      pool.query(sqluser, (err, datauser) => {
        res.render('issues/edit', {
          datauser: datauser.rows,
          data: data.rows,
          projectid: req.params.projectid,
          moment, path, pathside,
          isAdmin: req.session.user
        })
      })
    })
  })

  // ============================= Router Issues Update =============================
  router.post('/updateissue/:projectid/:issueid', (req, res) => {
    const {
      tracker,
      subject,
      description,
      status,
      priority,
      assignee,
      startdate,
      duedate,
      estimatedtime,
      progres,
      spenttime,
      tergetversion,
      parenttask } = req.body;

    let upload = req.files.fild;
    let filename = upload.name.toLowerCase().replace('', Date.now());
    if (status == "Closed") {
      sql = `UPDATE issues SET tracker = '${tracker}',
                                  subject = '${subject}',
                                  description = '${description}',
                                  status = '${status}',
                                  priority = '${priority}',
                                  estimatedtime = '${estimatedtime}',
                                  done = '${progres}',
                                  file = '${filename}',
                                  updateddate =  now(),
                                  closeddate = now(),
                                  parenttask = ${parenttask},
                                  spenttime = ${spenttime},   
                                  targetversion = '${tergetversion}',
                                  author = '${req.session.user.userid}',
                                  startdate = '${startdate}',
                                  duedate = '${duedate}',
                                  assignee = ${assignee} WHERE issueid = ${req.params.issueid}`;
    }
    else {
      sql = `UPDATE issues SET tracker = '${tracker}',
                                   subject = '${subject}',
                                   description = '${description}',
                                   status = '${status}',
                                   priority = '${priority}',
                                   estimatedtime = ${estimatedtime},
                                   done = '${progres}',
                                   file = '${filename}',
                                   updateddate =  now(),
                                   parenttask = ${parenttask},
                                   spenttime = ${spenttime},   
                                   targetversion = '${tergetversion}',
                                   author = '${req.session.user.userid}',
                                   startdate = '${startdate}',
                                   duedate = '${duedate}',
                                   assignee = ${assignee} WHERE issueid = ${req.params.issueid}`;
    }
    if (req.files) {
      upload.mv(pathnode.join(__dirname, `../public/images/${filename}`)), function (err) {
        if (err) console.log(err)
      }
    }

    pool.query(sql, (err) => {
      if (err) { console.log('fatal Error') }
      pool.query(`SELECT users.firstname, users.lastname FROM users WHERE userid = ${req.session.user.userid}`, (err, row) => {
        let date = new Date();
        let title = `${subject} #${req.params.issueid} (${status})`;
        pool.query(`INSERT INTO activity(title, description, author, time)VALUES('${title}','','${row.rows[0].firstname + ' ' + row.rows[0].lastname}', now())`, (err) => {
          if (err) { console.log("error", err) }
          res.redirect(`/projects/issues/${req.params.projectid}`)
        })
      })
    })
  })

  // ============================= Router Issues Delete =============================
  router.get('/issues/deleteissue/:projectid/:issueid', (req, res) => {
    pool.query(`DELETE FROM issues WHERE issueid = ${req.params.issueid}`, (err) => {
      res.redirect(`/projects/issues/${req.params.projectid}`)
    });
  });

  // ============================= Router Issues Option=============================
  router.post('/optionissues/:projectid', (req, res) => {
    let id = req.params.projectid;
    let sql = `UPDATE users SET issueoption = '${JSON.stringify(req.body)}' WHERE userid = ${req.session.user.userid}`;

    pool.query(sql, (err) => {
      if (err) { console.log('Not Found') }

      res.redirect(`/projects/issues/${id}`)
    })
  });


  // ============================= Router Overview =============================

  router.get('/overview/:projectid', auth, (req, res) => {
    let pathside = "overview";
    let id = req.params.projectid;
    pool.query(`SELECT users.firstname, users.lastname FROM members LEFT JOIN users ON members.userid = users.userid WHERE projectid = ${id}`, (err, data) => {
      pool.query(`SELECT count(*) as bug FROM issues WHERE projectid = ${id} AND tracker = 'Bug'`, (err, bug) => {
        pool.query(`SELECT count(*) as feature FROM issues WHERE projectid = ${id} AND tracker = 'Feature'`, (err, feature) => {
          pool.query(`SELECT count(*) as support FROM issues WHERE projectid = ${id} AND tracker = 'Support'`, (err, support) => {
            pool.query(`SELECT count(*) as statbug FROM issues WHERE projectid = ${id} AND tracker = 'Bug' AND status != 'Closed'`, (err, statbug) => {
              pool.query(`SELECT count(*) as statfeat FROM issues WHERE projectid = ${id} AND tracker = 'Feature' AND status != 'Closed'`, (err, statfeat) => {
                pool.query(`SELECT count(*) as statsuport FROM issues WHERE projectid = ${id} AND tracker = 'Support' AND status != 'Closed'`, (err, statsuport) => {
                  res.render('project/overview', {
                    title: 'overview',
                    datause: data.rows,
                    bug: bug.rows[0].bug,
                    feature: feature.rows[0].feature,
                    support: support.rows[0].support,
                    statbug: statbug.rows[0].statbug,
                    statfeat: statfeat.rows[0].statfeat,
                    statsuport: statsuport.rows[0].statsuport,
                    pathside, path,
                    projectid: req.params.projectid,
                    isAdmin: req.session.user
                  })
                })
              })
            })
          })
        })
      })
    })
  });

  // ============================= Router Members ============================= 
  router.get('/members/:projectid', auth, (req, res) => {


    const { cid, memberid, cname, name, cposition, membername } = req.query;
    let temp = []
    const pathside = "member";
    const url = (req.url == `/members/${req.params.projectid}`) ? `/members/${req.params.projectid}/?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 2;
    let offset = (page - 1) * limit

    if (cid && memberid) {
      temp.push(`members.id = ${memberid}`)
    }

    if (cname && name) {
      temp.push(`CONCAT (users.firstname,' ',users.lastname) = '${name}'`)
    }

    if (cposition && membername) {
      temp.push(`role = '${membername}'`)
    }
    let sql = `SELECT count(*) as total FROM members WHERE members.projectid = ${req.params.projectid}`;
    // if (temp.length > 0) {
    //   sql += ` WHERE ${temp.join(" AND ")}`
    // }
    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)
      let sqlmember = `SELECT projects.projectid, members.id, members.role, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM members LEFT JOIN projects ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE members.projectid = ${req.params.projectid}`;
      if (temp.length > 0) {
        sqlmember += ` AND ${temp.join(" AND ")}`
      }
      console.log(sqlmember);
      sqlmember += ` ORDER BY members.projectid LIMIT ${limit} OFFSET ${offset}`


      pool.query(sqlmember, (err, data) => {
        pool.query(`SELECT memberoption  FROM users  WHERE userid = ${req.session.user.userid}`, (err, option) => {
          res.render('member/index', {
            data: data.rows,
            projectid: req.params.projectid,
            current: page,
            pages: pages,
            url: url,
            fullname: data.fullname,
            option: option.rows[0].memberoption,
            pathside, path,
            isAdmin: req.session.user,
            query: req.query
          })
        })
      });
    })
  });

  // ============================= Router Members Add =============================
  router.get('/addMember/:projectid', auth, (req, res) => {
    const pathside = "member";
    let sqlmem = `SELECT userid FROM members WHERE projectid = ${req.params.projectid}`;
    let sql = `SELECT userid, firstname, lastname FROM users WHERE userid NOT IN (${sqlmem})`;
    pool.query(sql, (err, row) => {
      res.render('member/add', {
        row: row.rows,
        projectid: req.params.projectid,
        isAdmin: req.session.user,
        pathside, path,
      })
    })
  });

  // ============================= Router Members Save =============================
  router.post('/savemember/:projectid', (req, res) => {
    const { name, position } = req.body

    let sql = `INSERT INTO members(userid, role, projectid)VALUES(${name}, '${position}', ${req.params.projectid})`;
    pool.query(sql, (err, data) => {
      res.redirect(`/projects/members/${req.params.projectid}`)
    })
  });

  // ============================= Router Members Edit ============================= 
  router.get('/editmember/:projectid/:id', (req, res) => {
    const pathside = "member";
    let sql = `SELECT users.firstname, users.lastname, role, id FROM members LEFT JOIN users ON users.userid = members.userid WHERE projectid = ${req.params.projectid} AND id = ${req.params.id}`;
    console.log(sql)
    pool.query(sql, (err, data) => {
      res.render('member/edit', {
        projectid: req.params.projectid,
        id: req.params.id,
        data: data.rows[0],
        path,
        pathside,
        isAdmin: req.session.user
      })
    })
  });

  // ============================= Router Members Update =============================
  router.post('/updatemember/:projectid/:id', (req, res) => {
    const { position } = req.body;
    let sql = `UPDATE members SET role = '${position}' WHERE id =${req.params.id}`;
    pool.query(sql, (err) => {
      if (err) { console.log('Not Found') }
      res.redirect(`/members/${req.params.projectid}`)
    })
  })

  // ============================= Router Members Delete =============================
  router.get('/deletemember/:projectid/:id', (req, res) => {
    let sql = `DELETE FROM members WHERE id =${req.params.id}`
    pool.query(sql, (err) => 
      if (err) { console.log("Error Delete", err) }
      res.redirect(`/projects/members/${req.params.projectid}`);
    });
  });

  // ============================= Router Option Members ============================= 
  router.post('/optionmember/:projectid', auth, (req, res) => {
    let id = req.params.projectid;
    let sql = `UPDATE users SET memberoption = '${JSON.stringify(req.body)}' WHERE userid = ${req.session.user.userid}`;
    pool.query(sql, (err) => {
      res.redirect(`/projects/members/${id}`)
    });
  });

  // ============================= Router Activity ============================= 
  router.get('/activity/:projectid', (req, res) => {
    const pathside = "activity";
    const today = new Date();
    const sevenDaysBefore = new Date(today.getTime() - (6 * 24 * 60 * 60 * 1000));


    const sql = `select author, title, description from activity  where time between '${moment(sevenDaysBefore).format('YYYY-MM-DD')}' and '${moment(today).add(1, 'days').format('YYYY-MM-DD')}' order by time desc`;

    pool.query(sql, (err, data) => {

      let result = {};
      data.rows.forEach((item) => {
        if (result[moment(item.time).format('dddd')] && result[moment(item.time).format('dddd')].data) {
          result[moment(item.time).format('dddd')].data.push(item);
        } else {
          result[moment(item.time).format('dddd')] = { date: moment(item.time).format('YYYY-MM-DD'), data: [item] };
        }
      })

      res.render('project/activity', {
        projectid: req.params.projectid,
        path, pathside,
        isAdmin: req.session.user,
        data: result,
        today,
        sevenDaysBefore,
        moment
      })
    })
  });

  return router;
}