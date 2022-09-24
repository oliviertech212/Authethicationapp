//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyparser=require("body-parser");
const mongoose=require("mongoose");
const ejs=require("ejs");
const session=require("express-session");
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");


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
  password:String
})
// set up userSchema to use passport local mongoose as a plugin.
userschema.plugin(passportlocalmongoose);

const User=new mongoose.model("user",userschema);


// finally we used our passport local mongoose to create a local log in strategy and set a passport
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/",function(req,res){

  res.render("home");
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
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
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
