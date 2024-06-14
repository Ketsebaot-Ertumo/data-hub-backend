
const {sequelize} = require('../models/index')
const DataTypes = require('sequelize')
const User = require('../models/userModel')(sequelize, DataTypes);
const UR = require('../models/userRoleModel')(sequelize, DataTypes);
const jwt= require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const {generateConfirmationCode, generateToken} = require('../utilis/generateCode');
const {sendConfirmationEmail, sendPasswordResetEmail, sendConfResetEmail, sendWelcomeEmail, sendConfirmation} = require('../utilis/sendEmail');
const ErrorResponse=require('../utilis/errorResponse');
const userActivity = require('../utilis/userActivity');






//user sign up
exports.signup = async (req, res, next) => {
  const{ email, firstName, lastName, password,compantType  } = req.body;
    try{
      if (!firstName || !lastName || !email ||!password ||!compantType){
        return res.status(403).json({success: false,message: 'Please add user detail.' });
      }
        const userExist = await User.findOne({ where: { email: email.toLowerCase(),compantType} });
        if (userExist){
            return res.status(406).json({success: false,message: "E-mail already registered" });
        }
        const confirmationCode = generateConfirmationCode();
        const user =await User.create(req.body);
        // const user =await User.create({email,firstName,lastName, password,compantType});
        user.confirmationCode= confirmationCode;
        await user.save();
        const data = user.roles.map(role => {
          return { role, granted: true };
        });console.log(data);
        const urExist = await UR.findOne({ where: { email: email.toLowerCase()} });
        if(!urExist){
          const ur=await UR.create({ email:user.email,roles:data});
          await ur.save();
        }
        await sendConfirmationEmail(user.email, confirmationCode, user.firstName, user.lastName);
        await userActivity("user signed up", email );
        res.status(201).json({success: true,message: 'Please confirm/verify your email.',user }); 
    }catch (error){
      console.log(error);
      res.status(500).json({success: false, message: error.message, stack: error.stack });
    }
}


exports.confirmEmail = async (req, res) => {
  const { confirmationCode } = req.body;
  const token = req.cookies.token;
    try {
      if (!confirmationCode) {
        return res.status(400).json({success: false,message: "Please use a confirmationCode!" });
      }
      const user = await User.findOne({where:{ confirmationCode }});
      if (!user) {
        return res.status(306).json({success: false,message: "Invalid confirmation code/ Already confirmed!" });
      }
      // if(token){
      //   return res.status(406).json({success: false,message: "Already confirmed/verified" });
      // }
      user.confirmationCode = 'Confirmed';
      await user.save();
      await sendWelcomeEmail(user.email, user.firstName, user.lastName);

      sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: error.message, stack: error.stack });
    }
  };



//user signin
exports.signin = async (req, res, next) => {
    try{
        const {email, password} = req.body;
        const token = req.cookies.token;
        if (!email){
            return res.status(403).json({success: false,message: "Please add an email." });
        }
        if (!password){
            return res.status(403).json({success: false,message: "Please add a password." });
        }
        const user = await User.findOne({where:{email:email.toLowerCase()}});
        if (!user){
            return res.status(306).json({success: false,message: "Invalid credential." });
          }
        const isMatched = await user.comparePassword(password);
        if(!isMatched){
            return res.status(306).json({success: false, message: "Invalid credential." });
        }
        if(!token){
           const confirmationCode = generateConfirmationCode();
          user.confirmationCode= confirmationCode;
          await user.save();
          await sendConfirmationEmail(user.email, confirmationCode, user.firstName, user.lastName);
          await userActivity("user signed in", email );
          return res.status(200).json({success: true,message: "Please confirm/verify your email.", confirmationCode });
          }
        sendTokenResponse(user, 200, res);
    }
    catch (error){
        console.error(error);
        res.status(500).json({success: false, message: error.message, stack: error.stack });
    }
}


//logout
exports.logout = async (req, res, next) => {
    if(!token){
      return res.status(401).json({success: false,message: "You're alrady signed out!" })
    }
    res.clearCookie('token');
    res.status(200).json({success: true,message: "Logged out Successfully." })
}


//user forgot password
exports.forgotPassword = async (req, res, next) => {
        const {email} = req.body;
        try {
          if(!email){
            return res.status(403).json({success: false,message: "Please add email." });
          }
          const user = await User.findOne({where:{ email:email.toLowerCase()} });
          if (!user) {
            return res.status(404).json({success: false,message: "User not found" });
          }
          const resetToken = generateToken();
          user.resetToken = resetToken;
          await user.save();
          const resetLink1 =`https://tedatahub-d2qp8udl8-te-frontend.vercel.app/auth/resetPassword/${resetToken}`;
          const resetLink2 =`http://localhost:3000/auth/resetPassword/${resetToken}`;
          await sendPasswordResetEmail(user.email, resetLink1, resetLink2, user.firstName, user.lastName);
          res.status(200).json({success: true,message: 'Password Reset email sent, Please check your email.',resetToken,resetLink1, resetLink2});
          } catch (error) {
            console.log(err)
            res.status(500).json({success: false, message: error.message, stack: error.stack });
          }
      }


// user reset password
exports.resetPassword = async (req, res) => {
    const { newPassword,resetToken} = req.body;
    if(!newPassword || !resetToken){
      return res.status(400).json({success: false, message: 'Please use new password and resetToken.' });
    }
    try {
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      const user = await User.findOne({ where: { resetToken }});
      if (!user) {
        return res.status(401).json({success: false, message: 'User not found' });
      }
      // const user = await User.findOne({ where: { resetToken }});
      const isMatched = await user.comparePassword(newPassword);
      if(isMatched){
          return res.status(401).json({success: false,message: "Please enter a new password." });
      }
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = "Reseted";
        await user.save();
        await sendConfResetEmail(user.email, user.firstName, user.lastName);
        await userActivity("user reseted password", user.email );
        res.status(200).json({ success: true, message: 'Password reset successfully'});
      } catch (error) {
        console.log(err)
        res.status(500).json({success: false,message:'Please Reset password again!', error: error.message });
      }
}



// Twilio credentials
const {accountSid,authToken,twilioPhoneNumber,to,email}=process.env;

// Import the Twilio module
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

// Function to send an SMS
exports.sendSMS = async (req, res) => {
  const { message } = req.body;
  if(!message){
    return res.status(400).json({success:false,message:'Please use a message.'})
  }
  try {
    const code = generateConfirmationCode();
    const url="test.com/"

    const user = await User.findOne({where:{ email:req.user.email }});
    user.code= code;
    await user.save();

    const smsBody = `Message: ${message}\nCode: ${code}\nURL: ${url}`;
    
    await sendConfirmation(email, code, user.firstName, user.lastName, smsBody); 

    // Send the SMS
    const response = await client.messages.create({
      body: smsBody,
      from: twilioPhoneNumber,
      to: to
    });

    console.log(response.sid); // Log the SMS SID for reference
    res.status(200).json({ success: true, message: 'SMS sent successfully.',smsBody });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send SMS.', error: error.message });
  }
};


//confirming admin
exports.confirmSMS = async (req, res,next) => {
  const { code } = req.body;
  if(!code){
    return res.status(400).json({success:false,message:'Please use a code.'})
  }
  try{
    const user = await User.findOne({where:{ code }});
    if(!user){
      return res.status(400).json({success:false,message:'Please use correct code.'})
    }
    user.code = 'Confirmed';
    await user.save();
    res.status(200).json({success:true,message:'successfully confirmed.'})
  }catch(err){
    console.log(err)
    res.status(500).json({success: false,message: err.message });
  }
}


const sendTokenResponse = async (user, codeStatus, res)=>{
    const token = await user.getJwtToken();
    res
      .status(codeStatus)
       .cookie('token', token, {maxAge: 8 * 60 * 60 * 1000, httpOnly: true, secure: true,})
         .json({
            success: true,
            id: user.id,
            role: user.role,
            token: token,    
         });
}


// const sendTokenResponse = async (user, codeStatus, res) => {
//   const token = await user.getJwtToken();
//   res
//     .status(codeStatus)
//     .set('Authorization', `Bearer ${token}`)
//     .json({
//       success: true,
//       id: user.id,
//       role: user.role,
//       token: token,
//     });
// };