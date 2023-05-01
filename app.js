const express = require("express");
const mysql = require("mysql");

//reading the epress-session package
const session = require("express-session");

//Hashing
const bcrypt = require("bcrypt");

const app = express();

app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pathuri@4061",
  database: "My_Project",
});

//preparing to use the express-session package

app.use(
  session({
    secret: "my_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = "Guest";
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

connection.connect((err) => {
  if (err) {
    console.log("error connecting: " + err.stack);
    return;
  }
  console.log("success");
});

app.get("/", (req, res) => {
  res.render("top.ejs");
});

app.get("/list", (req, res) => {
  connection.query("SELECT * FROM articles", (error, results) => {
    res.render("list.ejs", { articles: results });
  });
});

app.get("/article/:id", (req, res) => {
  const id = req.params.id;
  connection.query(
    "SELECT * FROM articles WHERE id = ?",
    [id],
    (error, results) => {
      res.render("article.ejs", { article: results[0] });
    }
  );
});

// SignUp Functionality

app.get("/signup", (req, res) => {
  res.render("signup.ejs", { errors: [] });
});

app.post(
  "/signup",
  (req, res, next) => {
    console.log("Empty input value check");
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];

    if (username === "") {
      errors.push("Username is empty");
    }

    if (email === "") {
      errors.push("Email is empty");
    }

    if (password === "") {
      errors.push("Password is empty");
    }

    if (errors.length > 0) {
      res.render("signup.ejs", { errors: errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    console.log("Duplicate emails check");
    const email = req.body.email;
    const errors = [];
    connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (error, results) => {
        if (results.length > 0) {
          errors.push("Failed to register user");
          res.render("signup.ejs", { errors: errors });
        } else {
          next();
        }
      }
    );
  },
  (req, res) => {
    console.log("Sign up");
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, 10, (error, hash) => {
      connection.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hash],
        (error, results) => {
          req.session.userId = results.insertId;
          req.session.username = username;
          res.redirect("/list");
        }
      );
    });
  }
);

// Login functionality
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

//Login post
app.post("/login", (req, res) => {
  const email = req.body.email;
  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (error, results) => {
      if (results.length > 0) {
        // Define the plain constant
        const plain = req.body.password;

        // Define the hash constant
        const hash = results[0].password;

        // Add a compare method to compare the passwords
        bcrypt.compare(plain, hash, (error, isEqual) => {
          if (isEqual) {
            req.session.userId = results[0].id;
            req.session.username = results[0].username;
            res.redirect("/list");
          } else {
            res.redirect("/login");
          }
        });
        // Remove the code below
        // Remove the code above
      } else {
        res.redirect("/login");
        console.log("Login Failed");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    res.redirect("/list");
  });
});

app.listen(3000);
