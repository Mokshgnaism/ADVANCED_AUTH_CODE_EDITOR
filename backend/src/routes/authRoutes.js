import express from "express";
const router = express.Router();

router.post("/signIn",signIn);
router.post("/login",login);
