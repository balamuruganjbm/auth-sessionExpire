var express=require("express");
var mongoose=require("mongoose");
var bodyParser=require("body-parser");
var methodOverride=require("method-override");
var passport = require("passport");
var session = require('express-session');
var localStrategy = require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var cookieSession = require('cookie-session');
var app=express();
mongoose.connect("mongodb://localhost/authDB");

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
var userSchema=new mongoose.Schema({
   username:String,
   password:String
});
userSchema.plugin(passportLocalMongoose);
var User=mongoose.model("User",userSchema);


//PASSPORT CONFIGRATION
app.use(require("express-session")({
    secret:"windies",
    resave:false,
    saveUninitialized:false,
    cookie: { httpOnly: true, maxAge: 60000 }
}));

// app.use(cookieSession({
//   keys: ["windies"],

//   // Cookie Options
//   maxAge: 60000 // 24 hours
// }))
// app.use(express.session({
//              secret : 'your_cookie_secret',
//              cookie:{_expires : 60000}, // time im ms
//              })
//         ); 


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.currentUser=req.user;
    next();
});

//Sign up
app.get("/signup",(req,res)=>{
   res.render("signup") 
});

app.post("/signup",(req,res)=>{
    var newUser=new User({username:req.body.username});
    User.register(newUser,req.body.password,(err,user)=>{
       if(err){
           res.redirect("/signup");
       } 
       else{
           passport.authenticate("local")(req,res,()=>{
              res.redirect("/login"); 
           });
       }
    });
});

//LOG IN
app.get("/login",(req,res)=>{
   res.render("login"); 
});
app.post("/login",passport.authenticate("local",
    {
        successRedirect:"/home",
        failureRedirect:"/login"
    }),(req,res)=>{
});

//LOG OUT
app.get("/logout",(req,res)=>{
   req.logout();
   res.redirect("/login");
});
//HOME
app.get("/home",isLoggedIn,(req,res)=>{
   res.render("home"); 
});
//MIDDLEWARE
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
//INDEX ROUTES
app.get("/blog",function(req,res){
   Blog.find({},function(err,posts){
     if(err)
         console.log("Error in /blog");
     else
        res.render("index",{posts:posts});
   });
});
app.get("/",function(req,res){
   res.redirect("/blog"); 
});
//NEW BLOG ROUTE
app.get("/blog/new",function(req, res) {
   res.render("new"); 
});

//POST BLOG ROUTE
app.post("/blog",function(req,res){
    Blog.create(req.body.post,function(err,newpost){
       if(err)
        console.log("Error in post new blogpost");
       else
        res.redirect("/blog"); 
    });
});

//SHOW BLOG ROUTE
app.get("/blog/:id",function(req,res){
   Blog.findById(req.params.id,function(err,newpost){
      if(err)
      console.log("error in show");
      else
      res.render("show",{post:newpost});
   }); 
});

//EDIT BLOG
app.get("/blog/:id/edit",function(req, res) {
   Blog.findById(req.params.id,function(err,editpost){
      if(err)
      console.log("Error in edit");
      else
      {
          res.render("edit",{post:editpost});
      }
   }); 
});

//UPDATE BLOG
app.put("/blog/:id",function(req,res){
   Blog.findByIdAndUpdate(req.params.id,req.body.post,function(err,updatedpost) {
      if(err)
      console.log("Error in update");
      else
      res.redirect("/blog/"+req.params.id);
   }); 
});

//DELETE POST
app.delete("/blog/:id",function(req,res){
   Blog.findByIdAndRemove(req.params.id,function(err){
      if(err)
       console.log("Error in delete");
       else
       res.redirect("/blog")
   }); 
});
app.listen(process.env.PORT,process.env.IP,function(req,res){
    console.log("App started..!");
});