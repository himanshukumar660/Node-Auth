var express = require('express');
var router = express.Router();
var path = require('path');
var User = require('../models/user');
var Issue = require('../models/issue');
var Org = require('../models/org');
var shortId = require('short-mongo-id');

//Following are related with the issues 

/* Get the home page*/
router.get('/', ensureAuthentication, function(req, res, next) {
    console.log("Welcome to your homepage!");
    console.log(req.user);
    var username = req.user.username;

    Issue.getIssuesLatest(function(err1, res1){
      if(err1)
        console.log("Could'nt fetch the issues");
      else
      {
        User.getUserByUsername(username, function(err2,res2){
          if(err2) throw err2;
          else
          {
            Org.adminOrgs(username, function(err3, res3){
              if(err3) throw err3;
              else{
                Org.memberOrgs(username, function(err4, res4){
                 if(err4) throw err4;
                 else{
                  Org.pendingOrgs(username, function(err5, res5){
                    if(err5) throw err5;
                    else{
                        res.render('issues',{
                          title: 'Home',
                          username: req.user.username,
                          name: req.user.name,
                          adminctrlorgs: res3,
                          memberctrlorgs: res4,
                          pendingctrlorgs: res5,
                          userDetails: res2,
                          issues: res1
                        })
                    }
                  }) 
                  } 
                }); 
              }
            });
          }
        });        
      }
    });    
});

//Asynchronously get the Issues and populate the issue division
router.get('/getIssues/:date', ensureAuthentication, function(req,res, next){
  console.log("Fteching More Issues");
  var date = req.params.date;
  console.log(date);
  Issue.getIssuesByDate(date, function(err, results){
      if(err)
        console.log("Could'nt fetch the issues");
      else
      {
        console.log(results);
        res.send(results);
      }
  })
});


//When the user Likes any post
router.post('/likepost/:id', ensureAuthentication, function(req,res, next){
  console.log("Initiating to like the post");
  var _id = req.params.id;
  console.log(_id);
  var username = req.user.username;
  Issue.chkUserLikedPost(username, _id, function(err1, results1){
      if(err1) throw err1
      else
      {
         if(results1==null) //Not have liked before
         {
          Issue.addUsertoSupporters(username, _id, function(err2){
            if(err2) throw err2;
            else
            {
              Issue.incLikesByIssues(username, _id, function(err3){
                if(err3)
                  throw err3;
              });
            }
          });
        }
        else {
          Issue.removeUsertoSupporters(username, _id, function(err2){
            if(err2) throw err2;
            else
            {
              Issue.dcrLikesByIssues(req.user.username, _id, function(err3){
                  if(err3)
                    throw err3;
              });
            }
          });
        } 
      }
});
});

//When the user demands for a single post details
router.get('/indpost/:id', ensureAuthentication, function(req,res, next){
  console.log("Fteching the post details");
  var id = req.params.id;
  console.log(id);
  
  Issue.getIssueById(id, function(err, result){
      if(err)
        console.log("Could'nt fetch post details");
      else
      {
        console.log(result);
        res.render('indPost', {
          title: 'Post',
          details: result
        });
      }
  })
});

//Trending Posts : Fetch the issues with maximum number of Likes
router.get('/trending', ensureAuthentication, function(req, res, next) {
    console.log("Welcome to trending page!");
    console.log(req.user);
    //issueList = new Object();
    Issue.getIssueByLikes(function(err, results){
      if(err)
        console.log("Could'nt fetch the issues");
      else
      {
        User.getUserByUsername(req.user.username, function(req2,res2){
          if(err) throw err;
          else
          {
            res.render('home', {
              title: 'Home',
              userDetails: res2,
              issues: results
            });
          }
        });
      }
    });
});

//Post the issue
//Status : Checked
router.post('/post', ensureAuthentication, function(req, res, next) {
    if(req.body){
        var orgId = req.body.orguserId;
        var topic = req.body.issueDescriptionTopic;
        var desc = req.body.issueDescriptionText;
        var name = req.user.name;

        var anonymity;

        if(req.body.anonymity)
          anonymity =  "on";
        else
          anonymity = "off";

        var issue = new Issue({
          username: req.user.username,
          orgUserId: orgId,
          name: name,
          status: "open",
          issueTopic: topic,
          issueDesc: desc,
          anonymity: anonymity,
        });
        Org.findOrgByUID(orgId, function(err1, res1){
          if(err1) throw err1;
          else{
              issue.orgname = res1.name;
              Issue.createIssue(issue, function(err2, res2){
                if(err2) throw err2;
                  //console.log("Error Occured while uploading the post to the database");
                else{
                  console.log('Issue Posted..');
                }
              });    
          }
        });
        
      }
    res.redirect('/');
});


//Following deals with the user profiles


router.get('/profile/:username', ensureAuthentication, function(req, res, next) {
    console.log("Fetchgin the profile details");
    var username = req.params.username || req.user.username;
    console.log(username);
    User.getUserByUsername(username, function(err, resultsUser){
      if(err) throw err;
      else{
          Issue.getIssueByUsername(username, function(err, resultsIssue){
          if(err) throw err;
          else{
                res.render('profile', {
                title: 'Profile',
                profile: resultsUser,
                issues: resultsIssue
            });
          }
        });
      }
    });    
});



// Following deals with the APIs for accessing the organisation modiules.


router.post('/joinorg/:orgUId', ensureAuthentication, function(req, res, next) {
    console.log("Fetchgin the organisation details");
    var orgUId = req.params.orgUId;
    var username = req.user.username;
    console.log(orgUId);
    Org.enterOrg(orgUId, username, function(err2, res2){
      if(err2) throw err2;
      else
      {
        console.log('Added to pending Queue!!');
        console.log('Waiting for the adminstrator for accepting the request');
        res.redirect('back');
      }
    })   
});

router.post('/addmyorg', ensureAuthentication, function(req, res, next) {
    console.log("Initiating to add the organisation");
    var name = req.body.orgName;
    var aboutUs = req.body.orgAbout;
    var alert = req.body.orgAlert;
    

    var orgDtl = new Org({
      name:name,
      alert:alert,
      aboutUs: aboutUs,
      admin: [req.user.username],
      members: [req.user.username]
    });
    orgDtl.userId = shortId(orgDtl._id.toString()),
      
    console.log(orgDtl);

    Org.makeOrg(orgDtl, function(err1, res1){
      if(err1) {
        Org.adminOrgs(req.user.username, function(err2, res2){
          if(err2) throw err2;
          else{
            res.render('myorg', {
              title: 'My Organisations',
              orgs: res2,
              errorDup: err1
            });
          }
        });
      }
      else{
        console.log(res1);
      }
    });

    res.redirect('/myorg');
});

router.get('/myorg', ensureAuthentication, function(req, res, next) {
    console.log("loading organisation add page");
    var username = req.user.username;

    User.getUserByUsername(username, function(err2, res2){
      if(err2) throw err2;
      else{
        Org.adminOrgs(username, function(err3, res3){
          if(err3) throw err3;
          else{
            Org.memberOrgs(username, function(err4, res4){
              if(err4) throw err4;
              else{
                Org.pendingOrgs(username, function(err5, res5){
                  if(err5) throw err5;
                  else{
                      res.render('myorg',{
                        title: 'My Organisations',
                        adminctrlorgs: res3,
                        memberctrlorgs: res4,
                        pendingctrlorgs: res5,
                        userDetails: res2
                      })
                  }
                })
              }
            })    
          }
        });
      }
    })
});

router.get('/searchorg/:orgname', ensureAuthentication, function(req, res, next) {
    console.log("loading organisation add page");
    var username = req.user.username;
      User.getUserByUsername(username, function(err2,res2){
        if(err2) throw err2;
        else
        {
          var orgname = req.params.orgname;
          if(orgname=="q")
          {
            res.render('joinorg', {
              title: 'Explore Orgs',
              username: req.user.username,
              orgsByName: [],
              userDetails: res2,
              initial: "true"
            })
          }
          
          else{

            if(req.query.suborgquery)
              orgname = req.query.suborgquery;

            console.log(orgname);
            Org.adminOrgs(username, function(err3, res3){
              if(err3) throw res3;
              else
              {
                Org.memberOrgs(username, function(err4, res4){
                  if(err4) throw res4;
                  else{
                    Org.pendingOrgs(username, function(err5, res5){
                      if(err5) throw err5;
                      else{
                        Org.findInOrg(orgname, function(err6, res6){
                          if(err6) throw err6;
                          else{
                            res.render('joinorg',{
                              title: 'Explore Orgs',
                              username: req.user.username,
                              userDetails: res2,
                              adminctrlorgs: res3,
                              memberctrlorgs: res4,
                              pendingctrlorgs: res5,
                              orgsByName: res6,
                              initial: "false"
                            })    
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          }
        }
      });          
  });

router.post('/exitOrg/:orgUId', ensureAuthentication, function(req, res, next){
  var orgUId = req.params.orgUId;
  var username = req.user.username;
  Org.exitOrgAll(orgUId, username, function(err1, res1){
    if(err1) throw err1;
    else{
        //We have equated the following to 1 becuase of async nature of javascript. 
        // The Fact is that even after calling the exitOrgAdmin , the fucntion sees the previus state result.
        //So we need to make sure that we are not including the results of previous state of the database.
          if(res1.admin.length==1)
          {
            console.log("No one is Admin Now. Do somehting..");
            if(res1.members.length==1)
            {   
              //If no one is present in the organisation, just delete the organisation
              console.log("No one is member.. Finally delete the organisation");
              Issue.deleteIssueByOrgUserId(orgUId, function(err2, res2){
                if(err2) throw err2;
                else
                {
                  console.log('Deletion of issues successfull');
                  Org.deleteOrgEmptyMember(orgUId, function(err3, res3){
                    if(err3) throw err3;
                    else
                    {
                      res.redirect('/myorg');
                    }
                  })
                }
              });
            }
            else if(res1.members.length>1)
            {
              console.log("Found one member.. Make him the admin of the organisation");
              Org.makeUserAdmin(orgUId, res1.members[1], function(err2, res2){
                if(err2) throw err2;
                else{
                  res.redirect('/myorg');
                }
              });
            }
          }
          else if(res1.admin.length>1)
          {
            console.log("Admin already exists.. We are saved. ");
            Org.exitOrgMember(orgUId, username, function(err2, res2){
              if(err2) throw err2;
              else
                res.redirect('/myorg');
            });     
          }
          else
          {
            //This is the case when the admin equals to zero. In that case we would just delete the organisation.
            // The matter of fact is that the function never will execute this else condition.
          }
        }
      });
});


router.post('/delorg/:orgUId', ensureAuthentication, function(req, res, next) {
    console.log("Initiating Deletion of Organisation");
    var orgUId = req.params.orgUId;
    console.log(orgUId);
    Issue.deleteIssueByOrgUserId(orgUId, function(err1, res1){
      if(err1) throw err1;
      else
      {
        Org.deleteOrg(orgUId, req.user.username, function(err2, res2){
          if(err2) throw err2;
              else{
                  res.redirect('/myorg');
                }   
          });
      }
    });
});

function ensureAuthentication(req, res, next){
    if(req.isAuthenticated())
      return next();
    res.redirect('/users/login');
}


module.exports = router;
