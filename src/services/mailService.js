const nodemailer = require("nodemailer");

module.exports.sendMailService = async (from, to, subject, html) => {
  console.warn("FROM: ", from);
  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "ashwinfury3@gmail.com",
      pass: "fury$123"
    }
  });

  let info = await transporter.sendMail(
    {
      from, // sender address
      to, // list of receivers
      subject, // Subject line
      html // plain text body
    },
    (error, info) => {
      if (error) {
        console.log("Error while sending email");
        console.log(error.message);
        console.log(error);
        // return error.message;
      }
      console.log("success");
      console.log(info);
      // return info;
    }
  );
};
