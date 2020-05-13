const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function emailExists(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}

function findUser(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
}

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
  const user = users[req.cookies.user_id];
  let templateVars = {
    user: user,
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
  const user = users[req.cookies.user_id];
  let templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

/* 
* GET /urls/:shortURL
* READ
* Show a particular entry of the database
*/
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.user_id];
  let templateVars = {
    user: user,
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

app.get("/login", (req, res) => {
  res.render("user_login");
});

/* 
* POST /login
* 
*/
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (emailExists(email)) {
    const user = findUser(email);
    if (user.password === password) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.status(403);
      res.send("Error 403 Wrong password");
    }
  } else {
    res.status(403);
    res.send("Error 403 User with this email not found");
  }
});

/*
* POST /logout
* 
*/
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

/*
* GET /register
* Open user registration form
*/
app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
  let templateVars = {
    user: user
  };
  res.render("user_register", templateVars);
});

/*
* POST /register
* Register a new user
*/
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    res.status(400);
    res.send("Error 400 Some fields are empty");
  } else {
    if (!emailExists(email)) {
      const id = generateRandomString();
      users[id] = {
        id,
        email,
        password,
      };
      res.cookie("user_id", id);
      res.redirect("/urls");
    } else {
      res.status(400);
      res.send("Error 400 Email already taken");
    }
  }
  console.log(users);
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