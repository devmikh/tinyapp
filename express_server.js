const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/* 
* GET /
* Redirect to /urls page
*/
app.get("/", (req, res) => {
  res.redirect("/urls");
});

/*  
* GET /urls
* BROWSE
* Display all entries in the database
*/
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

/* 
* POST /urls
* ADD
* Add new entry to the database
*/
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

/* 
* GET /urls/new
* Render a page containing a form for creating new entries
*/
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

/* 
* GET /urls/:shortURL
* READ
* Show a particular entry of the database
*/
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

/*
* POST /urls/:shortURL/delete
* DELETE
* Delete a particular entry in the database
*/
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

/*
* POST /urls/:shortURL
* EDIT
* Edit a particular entry in the databse
*/
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

/* 
* GET /u/:shortURL
* Redirect to a long URL which corresponds to a passed short URL
*/
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]; 
  res.redirect(longURL);
});

/* 
* POST /login
* Login by creating a cookie with a username
*/
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

/*
* POST /logout
* Logout by deleting a cookie with a username
*/
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

/*
Routes for testing purposes
*/

// Get json version of a database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});