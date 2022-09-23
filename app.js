//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyparser=require("body-parser");
const mongoose=require("mongoose");
const ejs=require("ejs");
const encrypt=require("mongoose-encryption");

const app=express();
app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));


// database
mongoose.connect("mongodb://localhost:27017/userDB-for-secretapp",{useNewurlparser:true});
const userschema=new mongoose.Schema({
  email:String,
  password:String
})

// encryption

userschema.plugin(encrypt, { secret:process.env.SECRET, encryptedFields: ['password']});


const User=new mongoose.model("user",userschema);






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
app.post("/register",(req,res)=>{
   const newuser=new User({
     email:req.body.username,
     password:req.body.password
   });
   newuser.save((err)=>{
     if(err){
       console.log(err);
     }else{
       res.render("secrets");
     }
   });
});




// post for user to see if wee have credentials
app.post("/login",(req,res)=>{
  const username=req.body.username;
  const password=req.body.password;

  User.findOne({email:username}, (err,founduser)=>{
    if(err){
      console.log(err);
    }else{
      if(founduser){
        if(founduser.password === password){
          res.render("secrets");
        }else(
          res.send(  "please make sure your password is  correct")
            // console.log("please make sure your password is  correct")
        )
      }
    }
  });
});




app.listen(3000,()=>{
  console.log("hey server is running on port 3000");
})
