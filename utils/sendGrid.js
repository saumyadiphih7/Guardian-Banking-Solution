const sgMail = require("@sendgrid/mail");
const {
  // SENDGRID ENV
  SENDGRID_API_KEY,
  SENDGRID_MAIL,
  ACCOUNT_ACTIVATION_TEMPLATE_ID,
} = process.env;

// Set the API key
sgMail.setApiKey(SENDGRID_API_KEY);

// Dropzone OTP
exports.sendActivationEmail = async (data) => {
  const msg = {
    to: data.email,
    from: SENDGRID_MAIL,
    templateId: ACCOUNT_ACTIVATION_TEMPLATE_ID,
    dynamic_template_data: {
      activationURL: data.activationURL,
    },
  };

  await sgMail.send(msg);
};
