//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyparser=require("body-parser");
const mongoose=require("mongoose");
const ejs=require("ejs");
const session=require("express-session");
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");

// after getting client id and secret inside .env weneed to use package
const GoogleStrategy= require("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app=express();
app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
// here we've set session to have secret
app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));
// initialize passport
app.use(passport.initialize());
// here we use passport to manage our sessions
app.use(passport.session())

// database
mongoose.connect("mongodb://localhost:27017/userDB-for-secretapp",{useNewurlparser:true});
const userschema=new mongoose.Schema({
  email:String,
  password:String,
  // for getting our user // ID
  googleId:String,
  // secret:String
})
// set up userSchema to use passport local mongoose as a plugin.
userschema.plugin(passportlocalmongoose);

userschema.plugin(findOrCreate);

const User=new mongoose.model("user",userschema);


// finally we used our passport local mongoose to create a local log in strategy and set a passport
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){

  res.render("home");
});

// route for users register or sigup with google
app.get("/auth/google",
  // this will allows us to sign up or sign in user by using google
  passport.authenticate("google",{scope:["profile"]})
);

// route goole will redirect to user after sigup or sign
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res)=>{
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


app.get("/login",function(req,res){

  res.render("login");
});




// register route for new user
app.get("/register",function(req,res){

  res.render("register");
});

// secrets route
app.get("/secrets",(req,res)=>{
  // after submiting ourn user secret into db we no longer need
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }

 // User.find({"secret":{$ne:null}}, (err,foundusers)=>{
 //   if(err){
 //     console.log(err);
 //   }else{
 //     res.render("secrets",{userwithsecrets:foundusers});
 //   }
 // })

});



// submit route
// app.get("/submit",(req,res)=>{
//   if (req.isAuthenticated()){
//     res.render("submit");
//   }else{
//     res.redirect("/login");
//   }
// });

app.post("/submit",(req,res)=>{
  const submitsecret=req.body.secret;
  // find current user in database
  console.log(req.user.id);
  User.findById(req.user.id, (err,founduser)=>{
    if(err){
      console.log(err);
    }else{
      if(founduser){
        founduser.secret=submitsecret;
        founduser.save(()=>{
          res.redirect("/secrets");
        });

      }
    }
  })
});



// logout route
app.get("/logout",(req,res)=>{
  // to log out user we need to
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/register",(req,res)=>{
   User.register({username:req.body.username},req.body.password, (err,user)=>{
     if(err){
         console.log(err);
        res.redirect("/register");
     }else{
       passport.authenticate("local")(req,res,()=>{
         res.redirect("/secrets");
       })
     }
   })
});



// post for user to see if wee have credentials
app.post("/login",(req,res)=>{
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  // here we use login()  from passport
  req.login(user,(err)=>{
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/secrets")
      })
    }
  })


});




app.listen(3000,()=>{
  console.log("hey server is running on port 3000");
})
