
// import { client } from '../dbConfig.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';



import nodemailer from 'nodemailer'
import otpGenerator from "otp-generator";
import { User } from '../Models/User.js';

import mongoose from "mongoose";
import { Chat } from '../Models/Chat.js';
import { deleteImage } from '../utils/deleteImage.js';

export const getAllUser = async (req, res) => {
  try {
    const myId = req.user._id;

    const me = await User.findById(myId).select("friends friendRequests");

 const excludeIds = [
      me._id,
      ...me.friends,
      ...me.friendRequests
    ];

    const users = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludeIds }
        }
      },
      {
        $project: {
          fullName: 1,
          city: 1,
          country: 1,
          profilePic: 1,
          friendCount: { $size: "$friends" }
        }
      }
    ]);

    return res.status(200).json({
      message: "USERS_FETCHED",
      users,
      status: 1,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong",
      status: 0,
    });
  }
};




// Send friend request
export const toggelSendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.body.recieverId;

    if (!receiverId) return res.status(400).json({ message: "Receiver ID is required" });

    if (senderId.toString() === receiverId)
      return res.status(400).json({ message: "You cannot send request to yourself" });

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) return res.status(404).json({ message: "User not found" });

    if (sender.friends.includes(receiverId))
      return res.status(400).json({ message: "You are already friends" });

    // ✅ Cancel friend request
    if (
      sender.sentRequests.includes(receiverId) &&
      receiver.friendRequests.includes(senderId)
    ) {
      await User.findByIdAndUpdate(senderId, {
        $pull: { sentRequests: receiverId }
      });

      await User.findByIdAndUpdate(receiverId, {
        $pull: { friendRequests: senderId }
      });

      return res.status(200).json({
        success: true,
        message: "Friend request cancelled",
        friendId: receiverId
      });
    }

    // ✅ Send friend request
    await User.findByIdAndUpdate(senderId, {
      $addToSet: { sentRequests: receiverId }
    });

    await User.findByIdAndUpdate(receiverId, {
      $addToSet: { friendRequests: senderId }
    });

    return res.status(200).json({
      success: true,
      message: "Friend request sent successfully",
      friendId: receiverId
    });

  } catch (err) {
    console.log("Error sending request:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id; // authenticated user

    // Fetch the user and populate request senders
    const user = await User.findById(userId)
      .populate("friendRequests", "fullName email image.image friends") // fields to return
      .select("friendRequests");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      requests: user.friendRequests
    });

  } catch (error) {
    console.error("Error in getFriendRequest:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const requestAction = async (req, res) => {
  try {
    const { friendId, action } = req.body;
  
    if (!friendId || !action) {
      return res.status(400).json({
        status: 0,
        message: "Data is missing"
      });
    }
const myId= req.user._id;

    const me = await User.findById(myId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({
        status: 0,
        message: "Friend not found"
      });
    }

    // Check request exists
    if (!me.friendRequests.includes(friendId)) {
      return res.status(400).json({
        status: 0,
        message: "No request found from this user"
      });
    }

    // ACCEPT REQUEST
    if (action === "accept") {

      // Add each other as friends
      me.friends.push(friendId);
      friend.friends.push(myId);

      // Remove request from both sides
      me.friendRequests = me.friendRequests.filter(id => id.toString() !== friendId);
      friend.sentRequests = friend.sentRequests.filter(id => id.toString() !== myId.toString());

      await me.save();
      await friend.save();

      return res.status(200).json({
        status: 1,
        message: "Request_Accepted",
        friendId:friendId
      });
    }

    // REJECT REQUEST
    if (action === "reject") {

      // Remove request from both sides
      me.friendRequests = me.friendRequests.filter(id => id.toString() !== friendId);
      friend.sentRequests = friend.sentRequests.filter(id => id.toString() !== myId.toString());

      await me.save();
      await friend.save();

      return res.status(200).json({
        status: 1,
        message: "Request_Rejected",
        friendId:friendId
      });
    }

    return res.status(400).json({
      status: 0,
      message: "Invalid action"
    });

  } catch (error) {
    console.error("Error in requestAction:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFriends= async(req, res)=>{

  try{
    const myId = req.user._id;
    
    
    const user = await User.findById(myId)
    .populate("friends", "fullName profileImage city country ") // fields to return
  .select("friends");
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  return res.status(200).json({
    success: true,
    friends: user.friends
  });
  } catch (error) {
    console.error("Error in requestAction:", error);
    return res.status(500).json({ message: "Server error" });
  }
  
}
export const getProfile = async (req, res) =>{
try{
  let id ;
 if(req?.params?.id){
  id=req.params.id
 } 
 else{
  id= req.user._id
 }
  const checkUser = await User.findById(id)
  .select({fullName:1,bio:1, phone:1, city:1, country:1, friends:1, image:1, email:1, createdAt:1, profileImage:1, coverImage:1}) // Exclude sensitive fields like password and otp
  .populate({
        path: 'friends',
        select: 'fullName email phone city country  image.image', // Select the fields you want from the 'friends' documents
      })
      .exec();
if(!checkUser){
  return res.status(404).json({ message: "User not found" });
} 
  return res.status(200).json({
    success: true,
    profile: checkUser
  });

}
catch(error){
      console.error("Error in requestAction:", error.message);
    return res.status(500).json({ message: "Server error" });
}


}
export const nodeMailer = async (req, res)=> {
  try {
    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
      auth: {
user: process.env.email, 
pass: process.env.password,
      },
    });

    const emailFormat = /^[a-zA-Z0-9_.+]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    let email = req.body.email?.toLowerCase();

    if (!email || !email.match(emailFormat)) {
      return res.status(400).json({
        status: 0,
        message: "Email is Incorrect",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "Email is not registered!",
      });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // OTP expiration (5 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Save OTP to user
    await User.updateOne(
      { email: email },
      { $set: { otp: otp, expiresAt: expiresAt } }
    );

    // Email template
    const mailOptions = {
      from: 'Swapy <swapy@contact.com>',
      to: email,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">OTP Verification</h2>
          <p>Hello ${user.fullName},</p>
          <p>Your OTP for verification is: 
            <strong style="font-size: 24px; color: #ff6b6b;">${otp}</strong>
          </p>
          <p>This OTP will expire in 5 minutes.</p>
          <br>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    //console.log('Email sent: ' + info.response);
    res.json({
      status: 1,
      message: 'OTP generated and sent successfully',
      data: {email:email}, // ⚠️ remove in production
    });

  } catch (error) {
    console.error("Error Generating OTP: ", error);
    res.status(500).json({
      status: 0,
      message: "Internal Server Error",
    });
  }

    }

export const verifyOtp = async (req, res) => {
  try {
    const emailFormat = /^[a-zA-Z0-9_.+]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    const otpFormat = /^\d{6}$/;

    let email = req.body.email?.toLowerCase();
    let otp = req.body.otp;

    if (!email?.match(emailFormat) || !otp?.match(otpFormat)) {
      return res.status(400).json({
        status: 0,
        message: "OTP or email format is invalid",
      });
    }

    const verify = await User.findOne({ email });

    if (!verify) {
      return res.status(404).json({
        status: 0,
        message: "User not found or OTP incorrect",
      });
    }

    // Check if OTP matches explicitly (optional since already used in query)
    if (verify.otp !== otp) {
      return res.status(400).json({
        status: 0,
        message: "Please enter the correct OTP",
      });
    }

    // Check expiry
    if (verify.expiresAt < Date.now()) {
      return res.status(400).json({
        status: 0,
        message: "OTP has expired. Please request a new OTP.",
      });
    }
    await User.updateOne({email:email},{$set:{isVerified:true}});

    // ✅ Success response
    return res.status(200).json({
      status: 1,
      message: "OTP_VERIFIED",
      data: {
      email:  email,
       otp: otp,
      },
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      status: 0,
      message: error.message || "Internal server error",
    });
  }
};


export const resetPassword= async (req, res)=>{
        const emailFormat = /^[a-zA-Z0-9_.+]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      const otpFormat= /^\d{6}$/;         
  const passwordValidation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
            const {email, otp, password}= req.body;

if(!email.match(emailFormat) || !password.match(passwordValidation) || !otp.match(otpFormat)){
  return res.status(404).send({
        status : 0,
        message : "Please Enter Strong Password"
      })
    }

    if(!email || !password || !otp){
      return res.status(404).send({
        status : 0,
        message : "Please Enter Password"
      })
    }

     const verify= await User.findOne({email:email, otp:otp});
     //console.log(verify);
     
if(!verify){
res.status(404).json({
      status: 0,
      message: "User not found",
    });
}
const hashedPassword = await bcrypt.hashSync(password)
// if (verify.expiresAt < Date.now()) {
//             return res.status(400).json({
//                 status: 0,
//                 message: "Link has expired. Please request again."
//             });
//         }
await User.updateOne(
      { email: email, otp:otp },
      { $set: { password:hashedPassword } }
    );

res.status(200).send({        
   status: 1,
 message: "Password updated successful"
})

}
  //         let decoded = jwt.verify(token, process.env.SECRET, (err, decoded)=>{
  //             if (err) {
  //   if (err.name === "TokenExpiredError") {
  //     //console.log("Token expired");
  //     return res.status(401).send({
  //       status:0,
  //       message:"Token expired"
  //     })
  //   } else {
  //     //console.log("Invalid token");
  //           return res.status(401).send({
  //       status:0,
  //       message:"Invalid token"
  //     })
  //   }
  // } else {
  //   //console.log("Valid token:", decoded);
  // }
  //         });
          
  //           if(decoded){
  //               res.clearCookie('token',{
  //                   httpOnly: true,
  //                   secure: true
  //               })
  //               return res.status(200).send({
  //               status: 1,
  //               message: "logout successfully"
  //           })
  //           }

export const authMe=async (req, res)=>{
   try{
        const token = req.cookies?.token
        if(!token){
            return res.status(401).send({
                status: 0,
                message : 'Unauthorized'
            })
        }else{


         jwt.verify(token, process.env.SECRET,async (err, decoded)=>{


              if (err) {

    if (err.name === "TokenExpiredError") {

      return res.status(401).send({
        status:0,
        message:"Token expired"
      })

    } else {

            return res.status(401).send({
        status:0,
        message:"Invalid token"
      })
    }
    
  } else {


      const checkUser = await User.findOne({ _id: new ObjectId(decoded._id)})
      .select(
            { fullName: 1, email: 1, phone: 1, city: 1, country:1, profileImage: 1, coverImage:1 }
          );
  console.log(checkUser);
  if(!checkUser){
     return res.status(404).send({
        status:0,
        message:"User not found"
      })
  }
      return res.status(200).send({
                status: 1,
                message:"User_Logedin",
                data : checkUser
            })
  }
          });
          
            
        }

    }catch(error){
        return res.status(500).send({
            status: 0,
            error: error,
            message: "Something Went Wrong"
        })
    }
}

export const logOut=(req, res)=>{
   try{
        const token = req.cookies?.token
        if(!token){
            return res.status(401).send({
                status: 0,
                message : 'Unauthorized'
            })
        }else{
            let decoded = jwt.verify(token, process.env.SECRET);
            if(decoded){
                res.clearCookie('token',{
                    httpOnly: true,
                    secure: true,
                    sameSite: "none"
                })
                return res.status(200).send({
                status: 1,
                message: "logout successfully"
            })
            }
        }
    }catch(error){
        return res.send({
            status: 0,
            error: error,
            message: "Something Went Wrong"
        })
    }
}


export const sendMessage = async (data) => {
// console.log(req.body);

  const {receiverId, message} = data.body;
  const senderId=data.sender;
  
  if (!senderId || !receiverId || !message) {
    return res.status(400).send("Missing fields");
  }
//   const chat={
//     senderId,
//     receiverId, 
//     productId
//   }
// console.log(message);
// const query = {
//   $or: [
//     { senderId, receiverId },
//     { senderId: receiverId, receiverId: senderId },
//   ],
// };
// if (productId) query.productId = productId;

// const checkChat= await Chat.findOne(query)

const checkUser1 = await User.findOne({ _id: new ObjectId(receiverId) });
const checkUser2 = await User.findOne({ _id: new ObjectId(senderId) });

  if (!checkUser1 || !checkUser2) {
    throw new Error("User not found");
  }


  const newMessage = {
    senderId,
    receiverId,
    message
  };

  await Chat.insertOne(newMessage);
  return newMessage;
};


// 💬 Get Messages between two users
export const getMessages = async (req, res) => {
 try {
    const { otherId } = req.params;
    const myId = req.user._id;

    const messages = await Chat.find({

      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, data: messages });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};




export const getContacts = async (req, res) => {
  try {
    const myId = new ObjectId(req.user._id);

    const contacts = await Chat.aggregate([
      // 1: Match messages where logged in user is here
      {
        $match: {
          $or: [
            { senderId: myId },
            { receiverId: myId }
          ]
        }
      },

      // 2: Extract the other user in conversation
      {
        $project: {
          otherUser: {
            $cond: [
              { $eq: ["$senderId", myId] },
              "$receiverId",
              "$senderId"
            ]
          },
          message: 1,
          createdAt: 1
        }
      },

      // 3: Sort messages before grouping (important for $last)
      { $sort: { createdAt: 1 } },

      // 4: Group by other user → get LAST message + timestamp
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $last: "$message" },
          lastMessageTime: { $last: "$createdAt" }
        }
      },

      // 5: Lookup user info
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      // 6: Final shape
      {
        $project: {
          _id: 0,
          otherUser: "$_id",
          lastMessage: 1,
          lastMessageTime: 1,
          user: {
            _id: "$user._id",
            fullName: "$user.fullName",
profileImage: "$user.profileImage.image"
          }
        }
      },

      // 7: Sort latest chats first
      { $sort: { lastMessageTime: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: contacts
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


export const deleteChat = async (req, res) => {
  try {
    const { otherId } = req.body;
    console.log(otherId);
    
    const myId = req.user._id;

    // Find chat messages
    const messages = await Chat.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId }
      ]
    });

    // If no messages exist
    if (!messages || messages.length === 0) {
      return res.status(404).json({
        message: "No chat found to delete",
        status: 0
      });
    }

    // Delete all messages
    await Chat.deleteMany({
      
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId }
      ]
    });

    return res.json({
      status: 1,
      message: "Chat deleted successfully",
      otherId:otherId,
    });

  } catch (error) {
    res.status(500).json({
      status:0,
      message: "Error deleting chat",
      error: error.message
    });
  }
};


export const updateUserProfile= async(req, res)=>{
  
  try{
    
    const    userId =req.user._id

    const updateData = { ...req.body };
    const profileImage = req.files?.profileimage?.[0] || null;
    const coverImage = req.files?.coverimage?.[0] || null;
    
    console.log("Profile Image:", profileImage);
    console.log("Cover Image:", coverImage);
   
    const StoredUser = await User.findById(userId);
    

    if (!StoredUser) {
      return res.status(500).send({
        status: 0,
        message: "User Not Found"
        })
      }   
    if(profileImage){

      if(updateData.profilePublicId){
        await deleteImage(updateData.profilePublicId);
      }
      delete updateData.profilePublicId;
      updateData.profileImage={image:profileImage.path, publicId:profileImage.filename}
    }
    if(coverImage){
// 
            if(updateData.coverPublicId){
        await deleteImage(updateData.coverPublicId);
      }
      delete updateData.coverPublicId;
      updateData.coverImage={image:coverImage.path, publicId:coverImage.filename}
    }
    console.log("update data",updateData);

// if (req.file) {
//   //console.log(updateData);
  
//   // 🗑️ Delete the old image from Cloudinary (if it exists)
//   if (updateData.imageId) {
//     await deleteImage(updateData.imageId);
//  delete updateData.imageId;
//   }


//   // 🌩️ Save the new image info
//   updateData.image = {
//     image: req.file.path, // Cloudinary hosted URL
//     publicId: req.file.filename, // Cloudinary public_id (used for deleting later)
//   };
// }
    
const userUpdate = await User.updateOne(
  { _id: userId },
  updateData,
  { runValidators: true }
);

if (userUpdate.modifiedCount > 0) {
  const user = await User.findOne(
    { _id: userId },
    { fullName: 1, email: 1, phone: 1, city: 1, country:1, profileImage: 1, coverImage:1 }
  );

  return res.status(200).send({
    status: 1,
    message: "Profile updated successfully",
    data: user
  });
} else {
  return res.status(200).send({
    status: 1,
    message: "No changes made to profile",
  });
}

  }catch(error){

   return res.status(500).send({
    message: error.message,
    status: 0
  }) 
  }

}