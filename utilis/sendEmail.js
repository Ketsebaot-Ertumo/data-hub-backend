const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
        "user": process.env.USER_1,
        "pass": process.env.PASS_1
    },

});

exports.sendConfirmationEmail = async (email, confirmationCode, firstName, lastName) => {
    const mailOptions = {
        from: '"TechEthio Groups" <process.env.USER_1>',
        to: email,
        subject: 'Account Confirmation',
        text: `Hey ${firstName} ${lastName},<br><br>A sign in attempt requires further verification because we did not recognize your device. To complete the sign in, enter the verification code on the unrecognized device.
        <br><br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Verification code:<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<span style="font-size: 32px;"><b>${confirmationCode}</b></span>.<br><br>Thanks,<br>TechEthio Groups.`,
        html: `Hey ${firstName} ${lastName},<br><br>A sign in attempt requires further verification because we did not recognize your device. To complete the sign in, enter the verification code on the unrecognized device.
      <br><br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Verification code:<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<span style="font-size: 32px;"><b>${confirmationCode}</b></span>.<br><br>Thanks,<br>TechEthio Groups.`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('confirmation email sent:', info.response);
        return info; 
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        throw error; 
    } 

};


exports.sendWelcomeEmail = async (email, firstName, lastName) => {
    const mailOptions = {
        from: '"TechEthio Groups" <process.env.USER_1>',
        to: email,
        subject: 'Welcome to TechEthio',
        text: `Hello ${firstName} ${lastName},<br><br>Welcome to our website, You’ve just opened an account and are set to begin to signin to your account.<br><br>Thanks,<br>TechEthio Groups.</p>`,
        html: `Hello ${firstName} ${lastName},<br><br>Welcome to our website, You’ve just opened an account and are set to begin to signin to your account.<br><br>Thanks,<br>TechEthio Groups.</p>`,
    };

    await transporter.sendMail(mailOptions);
};


exports.sendPasswordResetEmail = async (email, resetLink1, resetLink2, firstName, lastName) => {
    const mailOptions = {
        from: '"TechEthio Groups" <process.env.USER_1>',
        to: email,
        subject: 'Password Reset',
        // text: `Please click the following link to reset your password: ${process.env.CLIENT_URL}/reset-password/${token}`,
        // html: `<p>Please click the following link to reset your password: <a href="${process.env.CLIENT_URL}/reset-password/${token}">${process.env.CLIENT_URL}/reset-password/${token}</a></p>`,
        text: `<p>Hey ${firstName} ${lastName},<br><br>Please click the following link to reset your password.
        <br><br>Password Reset link:&emsp;<span style="font-size: 18px;"><b>${resetLink1}<b></span><br>${resetLink2}.<br><br>Thanks,<br>TechEthio Groups.</p>`,
        html: `<p>Hey ${firstName} ${lastName},<br><br>Please click the following link to reset your password.
        <br><br>Password Reset link:&emsp;<span style="font-size: 18px;"><b>${resetLink1}<b></span><br>${resetLink2}.<br><br>Thanks,<br>TechEthio Groups.</p>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.response);
        return info; 
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error; 
    }
};


exports.sendConfResetEmail = async (email, firstName, lastName) => {
    const mailOptions = {
        from: '"TechEthio Groups" <process.env.USER_1>',
        to: email,
        subject: 'Your Account was recovered successfully',
        text: `Welcome back to your account ${firstName} ${lastName},<br><br>If you suspect you were locked out of your account because of changes made by someone else, you should review and protect your account.
      <br><br>Thanks,<br>TechEthio Groups.`,
        html: `<p>Welcome back to your account ${firstName} ${lastName},<br><br>If you suspect you were locked out of your account because of changes made by someone else, you should review and protect your account.
      <br><br>Thanks,<br>TechEthio Groups.</p>`,
    };

    await transporter.sendMail(mailOptions);
};


exports.shareWithEmail = async (email, pdfBuffer, fileName) => {
    const mailOptions = {
        from: '"TechEthio Groups" <process.env.USER_1>',
        to: email,
        subject: 'File attachment',
        text: `Hello Dear,<br><br>Please find the attached file.
      <br><br>Thanks,<br>TechEthio Groups.`,
        html: `<p>Hello Dear,<br><br>Please find the attached PDF.
      <br><br>Thanks,<br>TechEthio Groups.</p>`,
        attachments: [
            {
                filename: fileName,
                content: pdfBuffer,
            },
        ],
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('email sent with attachment', info.response);
        return info; 
    } catch (error) {
        console.error('Error sending email with attachment', error);
        throw error; 
    }
};


exports.sendConfirmation = async (email, code, firstName, lastName,smsBody) => {
    const mailOptions = {
        from: '"TechEthio Groups" <process.env.USER_1>',
        to: email,
        subject: 'Account Confirmation',
        text: `Hey ${firstName} ${lastName},<br><br>${smsBody}.<br><br>Thanks,<br>TechEthio Groups.`,
        html: `Hey ${firstName} ${lastName},<br><br><br><br>${smsBody}<br><br><br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Verification code:<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<span style="font-size: 32px;">
        <b>${code}</b></span>.<br><br>Thanks,<br>TechEthio Groups.`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('code confirmation email sent:', info.response);
        return info; 
    } catch (error) {
        console.error('Error sending code confirmation email:', error);
        throw error; 
    } 

};
