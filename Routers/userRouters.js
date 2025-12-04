import express from 'express'

import { deleteChat, getAllUser, getContacts, getFriendRequest, getFriends, getMessages, getProfile, requestAction, sendMessage, toggelSendFriendRequest, updateUserProfile } from '../Controller/UserController.js';
import { verifyToken } from '../Middleware/verifyToken.js';
import { upload } from '../Middleware/uploads.js';


const router = express.Router();

router.get('/getAllUsers',verifyToken,  getAllUser);
router.get('/getFriends',verifyToken, getFriends);
router.get('/getRequest',verifyToken, getFriendRequest);
router.post('/sendRequest',verifyToken, toggelSendFriendRequest);
router.post('/requestAction',verifyToken, requestAction);
router.get('/profile/:id',verifyToken, getProfile);
router.get('/profile',verifyToken, getProfile);

router.post("/send", verifyToken, async  (req, res) => {
  try {
    // console.log("data",req.body);
    const data={
      body: req.body,
      sender:req.user._id
    }
    const newMessage = await sendMessage(data);
    res.status(201).json({ success: true, message: "Message sent!", data: newMessage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
router.get("/messages/:otherId/:productId", verifyToken, getMessages);
router.get("/contacts",verifyToken, getContacts);
router.post("/deletechat",verifyToken, deleteChat);
router.post("/updateprofile",verifyToken,upload.fields([{name:"profileimage", maxCount:1}, {name:"coverimage", maxCount:1}]) ,updateUserProfile);


export default router;