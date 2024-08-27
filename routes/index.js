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
  passport.authenticate("local", { failureMessage: true }),
  function (req, res) {
    res.json({ user: req.user, message: "Logged in successfully" });
  }
);

router.post("/register", async (req, res) => {
  try {
    let sql1 = `
          select * from users
          where username = $1;
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
            returning id;
        `;

    // Save the user to the database
    const result2 = await pool.query(sql2, [req.body.username, hash, salt]);

    console.log(result2)

    const sql3 = `
      insert into tags (name, color_id, eff_status, created_dttm, modified_dttm, created_by_id, modified_by_id)
          values 
          ('Work', 1, 1, NOW(), NULL, $1, NULL),
          ('Personal', 2, 1, NOW(), NULL, $1, NULL),
          ('Shopping', 3, 1, NOW(), NULL, $1, NULL),
          ('Important', 4, 1, NOW(), NULL, $1, NULL),
          ('Urgent', 5, 1, NOW(), NULL, $1, NULL),
          ('Ideas', 6, 1, NOW(), NULL, $1, NULL),
          ('Reminders', 7, 1, NOW(), NULL, $1, NULL),
          ('Goals', 8, 1, NOW(), NULL, $1, NULL),
          ('Projects', 9, 1, NOW(), NULL, $1, NULL),
          ('Meetings', 10, 1, NOW(), NULL, $1, NULL),
          ('Travel', 11, 1, NOW(), NULL, $1, NULL),
          ('Health', 12, 1, NOW(), NULL, $1, NULL),
          ('Finance', 13, 1, NOW(), NULL, $1, NULL),
          ('Learning', 14, 1, NOW(), NULL, $1, NULL),
          ('Miscellaneous', 15, 1, NOW(), NULL, $1, NULL);
    `

    const result3 = await pool.query(sql3, [result2.rows[0].id]);

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
