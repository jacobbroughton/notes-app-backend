// const router = require("express").Router();
// const passport = require("passport");
// const genPassword = require("../lib/passwordUtils").genPassword;
// const pool = require("../config/database").pool;
// const isAuth = require("../authMiddleware").isAuth;
// const isAdmin = require("../authMiddleware").isAdmin;

import express from "express";
import passport from "passport";
import { genPassword } from "../lib/passwordUtils.js";
import { pool } from "../config/database.js";
import { isAuth, isAdmin } from "../authMiddleware.js";
import util from "util";

const router = express.Router();

router.get("/", isAuth, (req, res) => {
  res.send({ message: "You're logged in", user: req.user });
});

router.post(
  "/login",
  passport.authenticate("local", function (err, user, info, status) {
    console.log('inside passport authenticate', {info, status})
    if (err) {
      console.error(err)
      return next(err);
    }
    if (!user) {
      console.log("No user")
    }
   console.log("Made it to end, continuing")
  })(req, res, next),
  function (req, res) {
    console.log("Made it to login");
    console.log(req);
    console.log("=======");
    console.log(res);
    res.json({ user: req.user, message: "Logged in successfully" });
  }
);

router.post("/register", async (req, res) => {
  try {
    let sql1 = `
          select * from users
          where username = $1
        `;

    const result = await pool.query(sql1, [req.body.username]);

    if (result.length) {
      res.send({
        code: 2,
        message: "User already exists",
        user: null,
      });
      res.statusMessage = "User already exists";
      res.status(409).end();
      return;
    }

    const saltHash = genPassword(req.body.password);

    const salt = saltHash.salt;
    const hash = saltHash.hash;

    let sql2 = `
            insert into users (
                username,
                hash,
                salt,
                created_dttm,
                modified_dttm
            ) values (
                $1,
                $2,
                $3,
                now(), 
                null
            )
        `;

    // Save the user to the database
    const result2 = await pool.query(sql2, [req.body.username, hash, salt]);

    res.send({ result: result2, message: "Successfully registered" });
  } catch (error) {
    console.log(error);
    res.statusMessage = error.message || error.sqlMessage || "There was an error";
    res.status(409).end();
  }
});

router.get("/protected-route", isAuth, (req, res) => {
  res.send({ message: "You made it to the protected route", user: req.user });
});

router.get("/admin-route", isAdmin, (req, res) => {
  res.send({ message: "You made it to the admin route", user: req.user });
});

// Removes req.session.passport.user property from session
router.get("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      res.statusMessage = "There was an error logging out";
      res.status(409).end();
      return;
    }
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.send({ message: "Logged out successfully" });
  });
});

export default router;
