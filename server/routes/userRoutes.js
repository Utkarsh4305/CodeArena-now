const express = require("express");
const admin = require("../firebaseAdmin");
const router = express.Router();

router.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  const db = admin.firestore();

  try {
    const userDoc = await db.collection("Users").doc(username).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(userDoc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;    