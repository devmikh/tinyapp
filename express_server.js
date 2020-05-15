const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["secret", "rotation"]
}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "q02mvO",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "q02mvO",
  },
  "8fk8d2": {
    longURL: "http://www.reddit.com",
    userID: "Of2Aqa",
  },
};

const users = {
  'q02mvO': {
    id: 'q02mvO',
    email: 'user@example.com',
    password: '$2b$10$FJjGsupxLl8KHvmaWfw3juvKedP.msKc4Ir.gmbg9Ac.9gPfIxG8m',
  },
  'Of2Aqa': {
    id: 'Of2Aqa',
    email: 'user2@example.com',
    password: '$2b$10$1StNFPrbyCh1EhXmDMhniu7a8JIVIXS0T/PPSLlwHqjorroZq7ynO',
  },
};

/*
* GET /
* If a user is logged in, redirect to /urls page
* If a user is not logged in, redirect to /login page
*/
app.get("/", (req, res) => {
  const user = users[req.session.user_id];
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
  const user = users[req.session.user_id];
  if (user) {
    let templateVars = {
      user,
      urls: urlsForUser(user.id, urlDatabase),
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
  const user = users[req.session.user_id];
  if (user) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: user.id,
    };
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
  const user = users[req.session.user_id];
  if (user) {
    res.render("urls_new", { user });
  } else {
    res.redirect("/login");
  }
});

/*
* GET /urls/:shortURL
* READ
* If a user is logged in, show a particular entry
* If the entry does not exist, send an error message
* If a user is nog logged in, send an error message
*/
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  if (urlDatabase[req.params.shortURL]) {
    if (user && user.id === urlDatabase[req.params.shortURL].userID) {
      let templateVars = {
        user,
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
  const user = users[req.session.user_id];
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
  const user = users[req.session.user_id];
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
  const user = users[req.session.user_id];
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
  const user = getUserByEmail(email, users);
  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id;
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
  req.session = null;
  res.redirect("/urls");
});

/*
* GET /register
* If a user is logged in, redirect to /urls
* If a user is not logged in, open user registration form
*/
app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
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
    if (!getUserByEmail(email, users)) {
      const id = generateRandomString();
      const hashedPassword = bcrypt.hashSync(password, 10);
      users[id] = {
        id,
        email,
        password: hashedPassword
      };
      req.session.user_id = id;
      res.redirect("/urls");
    } else {
      res.status(400).send("Error 400: email already taken\n");
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});