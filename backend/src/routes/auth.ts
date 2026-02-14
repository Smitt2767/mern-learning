import express, { Router } from "express";

export const router: Router = express.Router();

router.route("/signin");
router.route("/signup");
router.route("callback/github");
router.route("callback/google");
