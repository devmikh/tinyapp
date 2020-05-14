const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "1a2b3c",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "1a2b3c"
  },
  "8fk8d2": {
    longURL: "http://www.reddit.com",
    userID: "4d5e6f"
  }
};

const users = { 
  "1a2b3c": {
    id: "1a2b3c", 
    email: "mishacyb@gmail.com", 
    password: "123"
  },
 "4d5e6f": {
    id: "4d5e6f", 
    email: "user2@example.com", 
    password: "456"
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

// Checks if the user with given an email exists in the database
function emailExists(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}

// Returns a user from the database given an email
function findUser(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
}

// Returns urls belonging to the user with a given id
function urlsForUser(id) {
  const result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
}

/* 
* GET /
* If a user is logged in, redirect to /urls page
* If a user is not logged in, redirect to /login page
*/
app.get("/", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

/*  
* GET /urls
* BROWSE
* If a user is logged in, display all entries in the database
* If a user is not logged in, send an error message
*/
app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    let templateVars = {
      user: user,
      urls: urlsForUser(user.id),
    };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send("Error 401: please register or login first\n");
  }
});

/* 
* POST /urls
* ADD
* If a user is logged in, add a new entry to the database
* If a user is not logged in, send an error message
*/
app.post("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.cookies.user_id;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("Error 403: access denied, cannot add a new entry while not logged in\n");
  }
});

/* 
* GET /urls/new
* If a user is logged in, render a page containing a form for creating new entries
* If a user is not logged in, send an error message
*/
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    let templateVars = {
      user: user
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

/* 
* GET /urls/:shortURL
* READ
* If a user is logged in, show the particular entry
* If the entry does not exist, send an error message
* If a user is nog logged in, send an error message
*/
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.user_id];
  if (urlDatabase[req.params.shortURL]) {
    if (user && user.id === urlDatabase[req.params.shortURL].userID) {
      let templateVars = {
        user: user,
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
      };
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send("Error 403: access denied, cannot show url\n");
    }
  } else {
    res.status(404).send("Error 404: page not found\n");
  }
});

/*
* POST /urls/:shortURL/delete
* DELETE
* If a user is logged in, delete the particular entry
* If a user is not logged in, send an error message
*/
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user && user.id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Error 403: access denied, cannot delete the url\n");
  }
  
});

/*
* POST /urls/:shortURL
* EDIT
* If a user is logged in, edit the particular entry
* If a user is not logged in, send an error message
*/
app.post("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user && user.id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    res.redirect("/urls");
  } else {
    res.status(403).send("Error 403: access denied, cannot edit the url\n");
  }
});

/* 
* GET /u/:shortURL
* Redirect to the long URL which corresponds to the passed short URL
*/
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL; 
    res.redirect(longURL);
  } else {
    res.status(404).send("Error 404: url does not exist\n");
  }
});

/*
* GET /login
* If a user is logged in, redirect to /urls
* If a user is not logged in, render login page
*/
app.get("/login", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("user_login");
  }
});

/* 
* POST /login
* LOGIN
* Logs the user in
* If the email provided does not exist, send an error message
* If the password does not match with the provided email, send an error message
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
        res.send("Error 403: wrong password\n");
      }
    } else {
      res.status(403);
      res.send("Error 403: user with this email not found\n");
    }
});

/*
* POST /logout
* LOGOUT
* Clear the cookie "user_id" and redirect to /urls
*/
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

/*
* GET /register
* If a user is logged in, redirect to /urls
* If a user is not logged in, open user registration form
*/
app.get("/register", (req, res) => {
  const user = users[req.cookies.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("user_register");
  }
});

/*
* POST /register
* REGISTER
* If any of the fields is empty, send an error message
* If the entered email is already taken, send an error message
*/
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === "" || password === "") {
    res.status(400).send("Error 400: some fields are empty\n");
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
      res.status(400).send("Error 400: email already taken\n");
    }
  }
  console.log(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});