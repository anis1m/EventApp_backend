const Account = require("../models/accountModel");
require("dotenv").config();
const nodemailer = require("nodemailer");
const Email = require("../utils/email");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { response } = require("express");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECERT, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendSMS = async (otp, phone) => {
  // Ensure the phone number starts with '+91' for India
  const formattedPhone = phone.startsWith("+91") ? phone : "+91" + phone;

  const client = new twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  return client.messages
    .create({
      body: `Please verify the account \n Your otp is ${otp} `,
      from: "+1 806 541 4777",
      to: formattedPhone,
    })
    .then((message) => console.log(message))
    .catch((err) => console.log(err));
};
exports.createAccount = async (req, res, next) => {
  try {
    const dataReceived = req.body;
    let existedaccount = null;

    if (dataReceived.email != null && dataReceived.email != "") {
      existedaccount = await Account.findOne({
        email: dataReceived.email,
      });
    } else {
      existedaccount = await Account.findOne({
        phone: dataReceived.phone,
      });
    }

    if (existedaccount != null) {
      return res.status(400).json({
        status: "error",
        message: "account already exists. please try to login",
      });
    }
    const account = await Account.create(req.body);
    const obtained = await Account.findOne({
      email: dataReceived.email,
    }).select("otp");

    if (dataReceived.email != null && dataReceived.email != "") {
      if (dataReceived.signedupby === "") {
        sendMail(
          dataReceived.email,
          "Your Otp to Verify Your Account is" +
            " " +
            obtained.otp +
            " ." +
            "Don't Share with Anyone",
          "Verify Your Account"
        );
      }
    } else {
      await sendSMS(obtained.otp, dataReceived.phone);
    }

    if (!account) {
      return res.status(404).json({
        status: "error",
        message: "Account not created",
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Account created successfully",
      data: account,
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: "Account not created",
      reason: err,
    });
  }
};

exports.verifyAccount = async (req, res, next) => {
  try {
    let { email, phone } = req.query;
    const { otp } = req.body;

    let query = {};
    if (email) {
      query.email = email;
    }
    if (phone) {
      query.phone = phone;
    }

    const account = await Account.findOne(query).select("otp isVerified");

    if (!account) {
      return res.status(404).json({
        status: "error",
        message: "Account not present",
      });
    }

    if (account.otp !== Number(otp)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }

    if (account.isVerified) {
      return res.status(400).json({
        status: "error",
        message: "Account already verified",
      });
    }

    account.isVerified = true;
    account.otp = undefined;

    await account.save();

    res.status(200).json({
      status: "success",
      message: "Account verified successfully",
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: "Cannot Verify the password",
      reason: err,
    });
  }
};

exports.loginAccount = async (req, res, next) => {
  const { email, password, phone, loggedinby } = req.body;
  console.log(req.body);

  if (loggedinby === "google") {
    return res.status(200).json({
      status: "success",
      message: "you have successfully logged in",
    });
  }

  let query = {};
  if (email) {
    query.email = email;
  }
  if (phone) {
    query.phone = phone;
  }
  const account = await Account.findOne(query).select("+password");
  console.log(
    password,
    account.password,
    await account.correctPassword(password, account.password)
  );
  if (
    !account ||
    !(await account.correctPassword(password, account.password))
  ) {
    return res.status(401).json({
      status: "error",
      message: "Invalid email or password",
    });
  }

  console.log("Account Id " + account._id);

  if (!account.isVerified) {
    return res.status(401).json({
      status: "error",
      message: "Account is not verified",
    });
  }
  switch (account.signedupby) {
    case "google":
      return res.status(400).json({
        status: "error",
        message: "you signed up by google. please login via google",
      });
    case "":
      return res.status(200).json({
        status: "success",
        message: "Account LogIn Successfully",
      });
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  console.log(req.body);
  const account = await Account.findOne({ email });

  if (!account) {
    return res.status(404).json({
      status: "error",
      message: "Error while performing action",
    });
  }

  const resetToken = await account.createPasswordResetToken();

  await account.save({ validateBeforeSave: false });

  const url = `http://localhost:3000/login/reset-password/${resetToken}?email=${email}`;

  await new Email(account.email, url).resetPassword();

  res.status(200).json({
    status: "Success",
    message: "Mail send to your inbox",
  });
};

exports.resetPassword = async (req, res, next) => {
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  console.log("Hashed Token " + hashToken);
  sendMail(
    req.query.email,
    "Password Reset Successfully. Now You can Login with Your new password",
    "Password Reset"
  );
  const account = await Account.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  if (!account) {
    return res.status(404).json({
      status: "error",
      message: "Token is invalid or Expired ",
    });
  }

  account.password = req.body.password;
  account.confirmPassword = req.body.confirmPassword;

  account.passwordResetToken = undefined;
  account.passwordResetExpires = undefined;

  await account.save({ validateBeforeSave: false });

  const token = signToken(account._id);

  console.log(account);
  res.status(200).json({
    status: "success",
    data: account,
    token,
  });
};

exports.updateAccount = async (req, res, next) => {
  const updateAccount = await Account.findByIdAndUpdate(
    req.params.accountId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updateAccount) {
    return res.status(404).json({
      status: "error",
      message: "Error while updating data",
    });
  }
  res.status(200).json({
    status: "success",
    data: updateAccount,
  });
};

exports.eventLiked = async (req, res, next) => {
  const { eventId, accountId } = req.params;
  const { isLiked } = req.body;
  console.log(eventId, isLiked);

  let update;
  if (isLiked) {
    update = { $addToSet: { eventLiked: eventId } };
  } else {
    update = { $pull: { eventLiked: eventId } };
  }

  // const user = await Account.findByIdAndUpdate(req.account._id, update, {
  //   new: true,
  //   runValidators: false,
  // });
  const user = await Account.findByIdAndUpdate(accountId, update, {
    new: true,
    runValidators: false,
  });

  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "Error while performing the action",
    });
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "You are not logged in! Please log in to get access.",
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECERT);

    const freshUser = await Account.findById(decoded.id);

    if (!freshUser) {
      return res.status(401).json({
        status: "error",
        message: "The user belonging to this token does no longer exist.",
      });
    }

    // ? User have changed his/her password

    if (freshUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: "error",
        message: "User recently changed password! Please log in again.",
      });
    }

    req.account = freshUser;

    next();
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getAccountEventIds = async function (req, res, next) {
  const { accId } = req.params;
  const EventIds = await Account.findById(accId);
  if (!EventIds) {
    return res.status(400).json({
      status: "error",
      message: "Failed to Fetch",
    });
  }

  res.status(200).json({
    status: "success",
    data: EventIds.eventLiked,
  });
};

exports.getAccountByEmail = async function (req, res, next) {
  const { email } = req.params;
  const account = await Account.find({
    email: email,
  });

  if (!account) {
    return res.status(400).json({
      status: "error",
      message: "failed to fetch",
    });
  }

  res.status(200).json({
    status: "success",
    data: account,
  });
};

exports.getAccountByPhone = async function (req, res, next) {
  const { phone } = req.params;
  console.log(phone);
  const account = await Account.find({
    phone: phone,
  });

  if (!account) {
    return res.status(400).json({
      status: "error",
      message: "failed to fetch",
    });
  }

  res.status(200).json({
    status: "success",
    data: account,
  });
};

function sendMail(toUserMail, Mailtext, title) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  let mailOptions = {
    from: process.env.GMAIL_USER,
    to: toUserMail,
    subject: title,
    text: Mailtext,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  });
}
