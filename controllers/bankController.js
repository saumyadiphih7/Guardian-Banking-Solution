const asyncHandler = require("express-async-handler");
// const { format } = require("date-fns");
// Models
// Bank
const bankModel = require("../models/bankModel");
const bankSettingsModel = require("../models/bankSettingsModel");
const applicationAcceptedModel = require("../models/applicationAcceptedModel");

// ----------------------------------------------------------- Profile -----------------------------------------------------------

// GET
// Bank Profile
exports.bankProfile = asyncHandler(async (req, res) => {
  const bank = await bankModel.findById(req.user.id).select("-password").lean();
  if (!bank) {
    res.status(404);
    throw new Error("No Bank Found");
  }
  res.status(200).json(bank);
});

// UPDATE
// Bank Profile
exports.bankProfileUpdate = asyncHandler(async (req, res) => {
  const id = req.user.id;
  try {
    const bank = await bankModel.findById(id);
    if (!bank) {
      res.status(404);
      throw new Error("No Bank Found");
    }

    const bankLogo = req.file;

    // Exclude specified fields from the update
    const fieldsToExclude = [
      "password",
      "access",
      "formFilled",
      "paymentStage",
      "createdAt",
      "updatedAt",
    ];
    fieldsToExclude.forEach((field) => delete req.body[field]);

    const updatedProfile = Object.assign(
      {
        bankLogo: bankLogo ? bankLogo.location : bankLogo,
      },
      req.body
    );

    const newProfile = await bankModel.findByIdAndUpdate(id, updatedProfile, {
      new: true,
    });

    res.status(200).json({ message: "Profile Updated", newProfile });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});

// UPDATE
// Password
exports.bankChangePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }
  try {
    const bank = await bankModel.findById(req.user.id).select("+password");

    const isMatch = await bank.comparePassword(oldPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Incorrect Old Password");
    }

    bank.password = newPassword;
    await bank.save();

    res.status(200).json({
      message: `${bank.bankName}, Your Password Changed Successfully`,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});

// ----------------------------------------------------------- Bank Settings -----------------------------------------------------------

// Function to replace undefined, null, or empty string with 0
const replaceWithZero = (value) => {
  return value === undefined || value === null || value === "" ? 0 : value;
};

// POST
// Bank Settings Fill up
exports.bankfillSettings = asyncHandler(async (req, res) => {
  const {
    // servicesOffered
    servicesOffered,
    // acc_creation_time,
    input,
    unit,
    convertedToDays,
    risk_classification,
    // Legal_Business,
    licensing_Type,
    num_employees_min,
    num_employees_max,
    accepted_states,
    foreign_operations,
    // Primary_Information,
    // ownership_Percentage_min,
    // ownership_Percentage_max,
    ownership_Percentage,
    us_Citizenship,
    // Operational_Details,
    products_purchased_providers,
    licensed_provider,
    acc_need_min,
    acc_need_max,
    num_locs_min,
    num_locs_max,
    transactions_Per_month_min,
    transactions_Per_month_max,
    // managed_square_feet_min,
    // managed_square_feet_max,
    facility,
    types_customers,
    // Other_Operational_Details,
    principal_business,
    beneficial_owners,
    number_beneficial_owner_min,
    number_beneficial_owner_max,
    // Anticipated_Transaction_Activity,
    amount_Initial_Deposit_min,
    amount_Initial_Deposit_max,
    estimated_total_amount_monthly_deposit_min,
    estimated_total_amount_monthly_deposit_max,
    estimated_total_num_monthly_deposit_min,
    estimated_total_num_monthly_deposit_max,
    anticipate_cash_deposits,
    amount_cash_deposits_min,
    amount_cash_deposits_max,
    frequency_cash_deposits,
    estimated_spend_min,
    estimated_spend_max,
    anticipate_cash_withdrawals,
    amount_cash_withdrawals_min,
    amount_cash_withdrawals_max,
    frequency_cash_withdrawals,
    monthly_payroll_min,
    monthly_payroll_max,
    cash_pick_ups,
    frequency_cash_pick_ups,
    estimated_cash_pick_ups_min,
    estimated_cash_pick_ups_max,
    // Company_Documentation
    Company_Documentation,
    // Legacy_Cash,
    legacy_cash,
    documents_available,
    // Cash_Management,
    business_acc,
    // length_time,
    lengthTimeInput,
    lengthTimeUnit,
    lengthTimeConvertedToDays,
    // payroll_service,
    // paid_cash,
    // payroll_accepted,
    // taxes_cash,
    penalty_cash,
    tax_payment,
    number_vendors_min,
    number_vendors_max,
    vendor_payment_methods,
    international_vendor,
    // Transfer_Existing_Bank,
    prev_bank_verified,
    prev_bank_aware,
    Interested_Services,
  } = req.body;
  // console.log(req.body);
  // const newDate = new Date();
  // Formatting Date as US Format
  // const date = format(newDate, "MM-dd-yyyy");

  const bankID = req.user.id;
  try {
    const bank = await bankModel.findById(bankID);

    // Checking of Bank has already filled the form
    const bankSettingsFilled = await bankSettingsModel.findOne({
      bank_ID: bankID,
    });
    if (bankSettingsFilled || bank.formFilled == true) {
      res.status(400);
      throw new Error(
        "Bank has already filled the bank settings... Now they can only edit"
      );
    }

    // Form Fill Up
    const fillForms = await bankSettingsModel.create({
      bank_ID: req.user.id,
      servicesOffered: servicesOffered,
      acc_creation_time: {
        input: replaceWithZero(input),
        unit,
        convertedToDays: replaceWithZero(convertedToDays),
      },
      risk_classification: risk_classification,
      Legal_Business: {
        licensing_Type: licensing_Type,
        num_employees_min: replaceWithZero(num_employees_min),
        num_employees_max: replaceWithZero(num_employees_max),
        accepted_states: accepted_states,
        foreign_operations,
      },
      Primary_Information: {
        // ownership_Percentage_min,
        // ownership_Percentage_max,
        ownership_Percentage: replaceWithZero(ownership_Percentage),
        us_Citizenship,
      },
      Operational_Details: {
        products_purchased_providers,
        licensed_provider,
        acc_need_min: replaceWithZero(acc_need_min),
        acc_need_max: replaceWithZero(acc_need_max),
        num_locs_min: replaceWithZero(num_locs_min),
        num_locs_max: replaceWithZero(num_locs_max),
        transactions_Per_month_min: replaceWithZero(transactions_Per_month_min),
        transactions_Per_month_max: replaceWithZero(transactions_Per_month_max),
        // managed_square_feet_min: replaceWithZero(managed_square_feet_min),
        // managed_square_feet_max: replaceWithZero(managed_square_feet_max),
        facility,
        types_customers: types_customers,
      },
      Other_Operational_Details: {
        principal_business,
        beneficial_owners,
        number_beneficial_owner_min: replaceWithZero(
          number_beneficial_owner_min
        ),
        number_beneficial_owner_max: replaceWithZero(
          number_beneficial_owner_max
        ),
      },
      Anticipated_Transaction_Activity: {
        amount_Initial_Deposit_min: replaceWithZero(amount_Initial_Deposit_min),
        amount_Initial_Deposit_max: replaceWithZero(amount_Initial_Deposit_max),
        estimated_total_amount_monthly_deposit_min: replaceWithZero(
          estimated_total_amount_monthly_deposit_min
        ),
        estimated_total_amount_monthly_deposit_max: replaceWithZero(
          estimated_total_amount_monthly_deposit_max
        ),
        estimated_total_num_monthly_deposit_min: replaceWithZero(
          estimated_total_num_monthly_deposit_min
        ),
        estimated_total_num_monthly_deposit_max: replaceWithZero(
          estimated_total_num_monthly_deposit_max
        ),
        anticipate_cash_deposits,
        amount_cash_deposits_min: replaceWithZero(amount_cash_deposits_min),
        amount_cash_deposits_max: replaceWithZero(amount_cash_deposits_max),
        frequency_cash_deposits: frequency_cash_deposits,
        estimated_spend_min: replaceWithZero(estimated_spend_min),
        estimated_spend_max: replaceWithZero(estimated_spend_max),
        anticipate_cash_withdrawals,
        amount_cash_withdrawals_min: replaceWithZero(
          amount_cash_withdrawals_min
        ),
        amount_cash_withdrawals_max: replaceWithZero(
          amount_cash_withdrawals_max
        ),
        frequency_cash_withdrawals: frequency_cash_withdrawals,
        monthly_payroll_min: replaceWithZero(monthly_payroll_min),
        monthly_payroll_max: replaceWithZero(monthly_payroll_max),
        cash_pick_ups,
        frequency_cash_pick_ups: frequency_cash_pick_ups,
        estimated_cash_pick_ups_min: replaceWithZero(
          estimated_cash_pick_ups_min
        ),
        estimated_cash_pick_ups_max: replaceWithZero(
          estimated_cash_pick_ups_max
        ),
      },
      Company_Documentation: Company_Documentation,
      Legacy_Cash: {
        legacy_cash,
        documents_available: documents_available,
      },
      Cash_Management: {
        business_acc,
        // length_time
        length_time: {
          lengthTimeInput: replaceWithZero(lengthTimeInput),
          lengthTimeUnit,
          lengthTimeConvertedToDays: replaceWithZero(lengthTimeConvertedToDays),
        },
        // payroll_service,
        // paid_cash,
        // payroll_accepted,
        // taxes_cash,
        penalty_cash,
        tax_payment,
        number_vendors_min: replaceWithZero(number_vendors_min),
        number_vendors_max: replaceWithZero(number_vendors_max),
        vendor_payment_methods: vendor_payment_methods,
        international_vendor,
      },
      Transfer_Existing_Bank: {
        prev_bank_verified,
        prev_bank_aware,
      },
      Interested_Services: Interested_Services,
      // createdAt: date,
    });
    if (!fillForms) {
      res.status(400);
      throw new Error("Error in filling the settings");
    }

    bank.formFilled = true;
    await bank.save();

    if (bank.matchedApplicationStatus == false) {
      res.status(201).json({
        message:
          "Bank Settings Saved Successfully. Please wait your account is under review",
        fillForms,
      });
    } else {
      res.status(201).json({
        message: "Bank Settings Saved Successfully.",
        fillForms,
      });
    }
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});

// UPDATE
// Bank Settings Update
exports.bankUpdateSettings = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  try {
    const bankSettings = await bankSettingsModel.findOne({ bank_ID: bankID });
    if (!bankSettings) {
      res.status(404);
      throw new Error("No bank Settings Found");
    }

    const updatedbankSettings = await bankSettingsModel.findByIdAndUpdate(
      bankSettings._id,
      req.body,
      { new: true }
    );
    res.status(200).json({
      message: "Bank Settings Updated Successfully",
      updatedbankSettings,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});

// GET
// Bank Settings Details
exports.bankSettingsDetails = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const bankSettings = await bankSettingsModel
    .findOne({ bank_ID: bankID })
    .lean();
  if (!bankSettings) {
    res.status(404);
    throw new Error("No Settings Found");
  }
  res.status(200).json(bankSettings);
});

// ----------------------------------------------------------- Bank Dashboard -----------------------------------------------------------

// GET
// Bank Dashboard
exports.dashboard = asyncHandler(async (req, res) => {
  const bankID = req.user.id;

  // Top accepted applications
  const acceptedApplications = await applicationAcceptedModel
    .find({ bank_ID: bankID })
    .limit(10);

  // Accepted Applications
  const numAcceptedApplications = await applicationAcceptedModel.countDocuments(
    { bank_ID: bankID }
  );
  // Number of applications in Underwriting
  const numUnderwriting = await applicationAcceptedModel.countDocuments({
    $and: [{ bank_ID: bankID }, { underwriting: true }],
  });
  // Number of accounts open
  const numAccountOpen = await applicationAcceptedModel.countDocuments({
    $and: [{ bank_ID: bankID }, { accountOpened: "Account Opened" }],
  });

  res.status(200).json({
    numAcceptedApplications,
    numUnderwriting,
    numAccountOpen,
    acceptedApplications,
  });
});

// ----------------------------------------------------------- Bank Services Offered -----------------------------------------------------------

// GET
// Bank Services Offered list
exports.getServicesOffered = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const bankSettings = await bankSettingsModel.findOne({ bank_ID: bankID });
  if (!bankSettings) {
    res.status(404);
    throw new Error("Bank hasn not yet filled the bank settings");
  }
  const servicesOffered = bankSettings.servicesOffered;
  res.status(200).json({ servicesOffered });
});
