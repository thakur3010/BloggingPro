const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const { Passport } = require("passport");


var singlePost = {};
var postid;
var updatePost = {};
var updateId;
var options = { weekday: "long",  
year: "numeric",  
month: "short",  
day: "numeric" };  

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());   

mongoose.connect('mongodb://localhost/userdb', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    posts: [{
        name: String,
        heading: String,
        date: String,
        desc: String
    }]
});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema); 

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

// app.post('/login', passport.authenticate('local', { successRedirect: '/',
//                                                     failureRedirect: '/login' }));

app.get("/",function(req,res){
    User.find(function(err,found){
        if(err){
        console.log(err);}
        else{
            // console.log(found);
           res.render("index",{post: found}); 
        }
    }
    );
    // res.render("index");
});


app.get("/addpost",function(req,res){
    if(req.isAuthenticated()){
        res.render("addpost");
    }
    else{
        res.redirect("/login");
    }
})

app.post("/submit", function(req, res){

   
    let date = new Date().toLocaleDateString("en-US",options);
    date = date + " " + new Date().toLocaleTimeString();
    const obj = {
        name: req.body.name,
        heading: req.body.heading,
        date: date,
        desc: req.body.desc
} ;
  
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);
  
    User.findOneAndUpdate(
        { _id: req.user.id }, 
        { $push: { posts: obj  } },
       function (error, success) {
             if (error) {
                 console.log(error);
             } else {
                res.redirect("/main");
             }
         });
     
    
    
    // findById(req.user.id, function(err, foundUser){
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     if (foundUser) {
    //       foundUser.secret = submittedSecret;
    //       foundUser.save(function(){
    //         res.redirect("/secrets");
    //       });
    //     }
    //   }
    // });
  });


app.get("/register",function(req,res){
    res.render("register");
});

app.get("/main",function(req,res){
    User.findById(req.user.id, function(err, foundUser){
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            res.render("main",{posts: foundUser.posts});
          }
        }
      });
})

app.post("/register",function(req,res){
    User.register({username: req.body.username}, req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/main");
            })
        }
    })
})

app.get("/login",function(req,res){
    res.render("login");
})

app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/main");
            });
        };
    });
});

app.get('/post/:blogID', function (req, res,) {
    // console.log(req.params.blogID.split(":"));
     postid = req.params.blogID;
    User.find(function(err,post){
        singlePost = post;
    });
    
    res.redirect("/post");
});
app.get('/post', function (req, res,) {
    
    res.render("post",{post: singlePost,id: postid});
});

// app.get('/addPost', function (req, res,) {
//     res.render("addPost",{});
// });

app.get('/contact', function (req, res,) {
    res.render("contact",{});
});





app.get("/delete/:blogID",function(req,res){
    const id = req.params.blogID;
    User.findByIdAndUpdate(
        req.user.id, { $pull: { "posts": { _id: req.params.blogID } } }, { safe: true, upsert: true },
        function(err, node) {
            if (err) { return handleError(res, err); }
           else{
               res.redirect("/main");
           }
        });
})


app.get("/about",function(req,res){
    res.render("about");
})






app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
})

app.listen(3000,function(){
    console.log("listening...");
})