import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: false,
        default: null

    },
    email: {
        type: String,
        required: false,
        trim: true,
        default: null,
        lowercase: true,
    },
    password: {
        type: String,
        required: false,
        trim: true,
        default: null,
        select: false
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        default: null,
    },
    
    city: {
        type: String,
        required: false,
        default: null,     
                trim: true,
    },
    bio: {
        type: String,
        required: false,
        default: null,
    
    },
    
    
    country: {
        type: String,
        required: false,
        trim: true,
        default: null,
          
    },

    friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // Requests the user SENT
  sentRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // Accepted friends
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
    otp: {
      type: String,   // or Number
      default: null,
      required: false,
    },
    expiresAt: {
      type: Date,     // best option: Date type
      default: null,
     required: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
 profileImage: {
      image: { type: String, required: false, default: null },     // Cloudinary URL
      publicId: { type: String, required: false, default: null },  // Cloudinary public ID
    },
coverImage: {
      image: { type: String, required: false, default: null },     // Cloudinary URL
      publicId: { type: String, required: false, default: null },  // Cloudinary public ID
    },

},{ timestamps: true });

export const User = mongoose.model('User', userSchema);