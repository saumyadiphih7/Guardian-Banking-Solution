const nodeMailer = require("nodemailer");
const { SMTP_HOST, SMTP_PORT, SMTP_SERVICE, SMTP_MAIL, SMTP_PASSWORD } =
  process.env;

const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    service: SMTP_SERVICE,
    auth: {
      user: SMTP_MAIL,
      pass: SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: {
      name: "Guardian Banking Solutions",
      address: SMTP_MAIL,
    },
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
