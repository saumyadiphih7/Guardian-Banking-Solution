const asyncHandler = require("express-async-handler");
const { randomBytes } = require("crypto");
// const { format } = require("date-fns");
// Models
// Operator
const operatorModel = require("../models/operatorModel");
const operatorApplicationModel = require("../models/operatorApplicationModel");
const operatorDocumentModel = require("../models/operatorDocumentModel");
const proposalRecievedModel = require("../models/proposalRecievedModel");

// ----------------------------------------------------------- Profile -----------------------------------------------------------

// GET
// Operator Profile
exports.operatorProfile = asyncHandler(async (req, res) => {
  const operator = await operatorModel
    .findById(req.user.id)
    .select("-password")
    .lean();
  if (!operator) {
    res.status(404);
    throw new Error("No Operator Found");
  }
  res.status(200).json(operator);
});

// UPDATE
// Operator Profile
exports.operatorProfileUpdate = asyncHandler(async (req, res) => {
  const id = req.user.id;
  try {
    const operator = await operatorModel.findById(id);
    if (!operator) {
      res.status(404);
      throw new Error("No Operator Found");
    }

    const operatorLogo = req.file;

    // Exclude specified fields from the update
    const fieldsToExclude = [
      "password",
      "access",
      "formFilled",
      "createdAt",
      "updatedAt",
    ];
    fieldsToExclude.forEach((field) => delete req.body[field]);

    const newProfile = Object.assign(
      {
        operatorLogo: operatorLogo ? operatorLogo.location : operatorLogo,
      },
      req.body
    );

    const updatedProfile = await operatorModel.findByIdAndUpdate(
      id,
      newProfile,
      {
        new: true,
      }
    );

    res.status(200).json({ message: "Profile Updated", updatedProfile });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});

// UPDATE
// Password
exports.operatorChangePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }
  try {
    const operator = await operatorModel
      .findById(req.user.id)
      .select("+password");

    const isMatch = await operator.comparePassword(oldPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Incorrect Old Password");
    }

    operator.password = newPassword;
    await operator.save();

    res.status(200).json({
      message: `${operator.name}, Your Password Changed Successfully`,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});

// ----------------------------------------------------------- Applications -----------------------------------------------------------

// Function to replace undefined, null, or empty string with 0
const replaceWithZero = (value) => {
  return value === undefined || value === null || value === "" ? 0 : value;
};

// POST
// Application Fill
exports.fillApplication = asyncHandler(async (req, res) => {
  const {
    // Services Wanted
    servicesWanted,
    accountPurpose,
    // acc_need_time,
    input,
    unit,
    convertedToDays,
    // Main Questions
    risk_classification,
    // Legal_Business,
    name,
    dba,
    physical_Address,
    mailing_Address,
    federal_EIN,
    cannabis_License_Number,
    license,
    num_employees,
    accepted_states,
    foreign_operations,
    // Primary_Information,
    primary_contact_name,
    primary_address,
    dob,
    mail,
    primary_Phone,
    ownership,
    ownership_Percentage,
    authority_sign,
    us_Citizenship,
    // Operational_Details,
    products_purchased_providers,
    licensed_provider,
    acc_need,
    num_locs,
    transactions_Per_month,
    purchase_amount_per_sale,
    num_plants,
    // average_quantity_per_sale,
    quantityInput,
    quantityUnit,
    convertedToGram,
    facility,
    lease_term,
    egmi,
    types_customers,
    // Other_Operational_Details,
    principal_business,
    beneficial_owners,
    number_beneficial_owner,
    // Additional_Locs,
    Additional_Locs,
    // Anticipated_Transaction_Activity,
    amount_Initial_Deposit,
    source_Initial_Deposit,
    estimated_total_amount_monthly_deposit,
    estimated_total_num_monthly_deposit,
    anticipate_cash_deposits,
    amount_cash_deposits,
    frequency_cash_deposits,
    estimated_spend,
    anticipate_cash_withdrawals,
    amount_cash_withdrawals,
    frequency_cash_withdrawals,
    monthly_payroll,
    cash_pick_ups,
    frequency_cash_pick_ups,
    estimated_cash_pick_ups,
    // Company_Documentation
    Company_Documentation,
    // Legacy_Cash,
    legacy_cash,
    documents_available,
    // Cash_Management,
    business_acc,
    bank_name,
    // length_time,
    lengthTimeInput,
    lengthTimeUnit,
    lengthTimeConvertedToDays,
    reason_to_close,
    // payroll_service,
    // paid_cash,
    // payroll_accepted,
    // taxes_cash,
    penalty_cash,
    tax_payment,
    number_vendors,
    vendor_payment_methods,
    international_vendor,
    electronic_payment,
    current_cash_managment,
    // Transfer_Existing_Bank
    financial_institution,
    existing_bank_contact,
    existing_bank_name,
    original_deposite,
    prev_bank_verified,
    reason_closure,
    prev_bank_aware,
    // Electronic_Payments_Settlement,
    settlement_num_loc,
    msb,
    money_transmitted_license,
    types_payments,
    mobile_app,
    pos,
    credit_card,
    bank_aware,
    merchant_processor,
    // merchant_processor_loc,
    // transaction_desc,
    // transaction_code,
    terminal,
    // ATM_Machine,
    atm_own,
    atm_loc,
    atm_multiple,
    atm_fill,
    atm_third_party,
    atm_fill_company,
    atm_currency,
    atm_crypto,
    atm_deposite,
    atm_receipt,
    // Accounting,
    accounting_system,
    accountant,
    firm_name,
    // Compliance_Details,
    non_compliance,
    compliance_desc,
    compliance_officer,
    compliance_partner,
    compliance_partner_name,
    compliance_group,
    onsite_inspection,
    compliance_date,
    frequency_compliance,
    compliance_trainning,
    operating_procedures,
    Interested_Services,
  } = req.body;

  try {
    // Generate a unique ID with 8 characters
    const uniqueId = randomBytes(4).toString("hex");
    // To Get just the Date of Application Fill
    // const newDate = new Date();
    // Formatting Date as US Format
    // const date = format(newDate, "MM-dd-yyyy");

    // Application Fill Up
    const filledApplication = await operatorApplicationModel.create({
      applicant_ID: req.user.id,
      application_Id: uniqueId,
      servicesWanted: servicesWanted,
      accountPurpose: accountPurpose,
      acc_need_time: {
        input: replaceWithZero(input),
        unit,
        convertedToDays: replaceWithZero(convertedToDays),
      },
      risk_classification,
      Legal_Business: {
        name,
        dba,
        physical_Address,
        mailing_Address,
        federal_EIN,
        cannabis_License_Number,
        license,
        num_employees: replaceWithZero(num_employees),
        accepted_states: accepted_states,
        foreign_operations,
      },
      Primary_Information: {
        primary_contact_name,
        primary_address,
        dob,
        mail,
        primary_Phone,
        ownership,
        ownership_Percentage: replaceWithZero(ownership_Percentage),
        authority_sign,
        us_Citizenship,
      },
      Operational_Details: {
        products_purchased_providers,
        licensed_provider,
        acc_need: replaceWithZero(acc_need),
        num_locs: replaceWithZero(num_locs),
        transactions_Per_month: replaceWithZero(transactions_Per_month),
        purchase_amount_per_sale: replaceWithZero(purchase_amount_per_sale),
        num_plants: replaceWithZero(num_plants),
        average_quantity_per_sale: {
          quantityInput: replaceWithZero(quantityInput),
          quantityUnit: quantityUnit,
          convertedToGram: replaceWithZero(convertedToGram),
        },
        facility,
        lease_term: facility == "Owned" ? "Didnot fill in" : lease_term,
        egmi: replaceWithZero(egmi),
        types_customers: types_customers,
      },
      Other_Operational_Details: {
        principal_business,
        beneficial_owners,
        number_beneficial_owner: replaceWithZero(number_beneficial_owner),
      },
      Additional_Locs,
      Anticipated_Transaction_Activity: {
        amount_Initial_Deposit: replaceWithZero(amount_Initial_Deposit),
        source_Initial_Deposit,
        estimated_total_amount_monthly_deposit: replaceWithZero(
          estimated_total_amount_monthly_deposit
        ),
        estimated_total_num_monthly_deposit: replaceWithZero(
          estimated_total_num_monthly_deposit
        ),
        anticipate_cash_deposits,
        amount_cash_deposits:
          anticipate_cash_deposits == "no"
            ? 0
            : replaceWithZero(amount_cash_deposits),
        frequency_cash_deposits:
          anticipate_cash_deposits == "no" ? "" : frequency_cash_deposits,
        estimated_spend:
          anticipate_cash_deposits == "no"
            ? 0
            : replaceWithZero(estimated_spend),
        anticipate_cash_withdrawals,
        amount_cash_withdrawals:
          anticipate_cash_withdrawals == "no"
            ? 0
            : replaceWithZero(amount_cash_withdrawals),
        frequency_cash_withdrawals:
          anticipate_cash_withdrawals == "no" ? "" : frequency_cash_withdrawals,
        monthly_payroll:
          anticipate_cash_withdrawals == "no"
            ? 0
            : replaceWithZero(monthly_payroll),
        cash_pick_ups,
        frequency_cash_pick_ups:
          cash_pick_ups == "no" ? "" : frequency_cash_pick_ups,
        estimated_cash_pick_ups:
          cash_pick_ups == "no" ? 0 : replaceWithZero(estimated_cash_pick_ups),
      },
      Company_Documentation: Company_Documentation,
      Legacy_Cash: {
        legacy_cash,
        documents_available: documents_available,
      },
      Cash_Management: {
        business_acc,
        bank_name: business_acc == "no" ? "Didnot fill in" : bank_name,
        // length_time,
        length_time: {
          lengthTimeInput:
            business_acc == "no" ? 0 : replaceWithZero(lengthTimeInput),
          lengthTimeUnit,
          lengthTimeConvertedToDays:
            business_acc == "no"
              ? 0
              : replaceWithZero(lengthTimeConvertedToDays),
        },
        reason_to_close:
          business_acc == "no" ? "Didnot fill in" : reason_to_close,
        // payroll_service,
        // paid_cash,
        // payroll_accepted,
        // taxes_cash,
        penalty_cash,
        tax_payment,
        number_vendors: replaceWithZero(number_vendors),
        vendor_payment_methods: vendor_payment_methods,
        international_vendor,
        electronic_payment,
        current_cash_managment,
      },
      Transfer_Existing_Bank: {
        financial_institution,
        existing_bank_contact,
        existing_bank_name,
        original_deposite,
        prev_bank_verified,
        reason_closure,
        prev_bank_aware,
      },
      Electronic_Payments_Settlement: {
        settlement_num_loc: replaceWithZero(settlement_num_loc),
        msb,
        money_transmitted_license,
        types_payments,
        mobile_app,
        pos,
        credit_card,
        bank_aware,
        merchant_processor,
        // merchant_processor_loc,
        // transaction_desc,
        // transaction_code,
        terminal,
      },
      ATM_Machine: {
        atm_own,
        atm_loc,
        atm_multiple,
        atm_fill,
        atm_third_party,
        atm_fill_company,
        atm_currency: replaceWithZero(atm_currency),
        atm_crypto,
        atm_deposite,
        atm_receipt,
      },
      Accounting: {
        accounting_system,
        accountant,
        firm_name: accountant == "Internal" ? "Didnot fill in" : firm_name,
      },
      Compliance_Details: {
        non_compliance,
        compliance_desc:
          non_compliance == "no" ? "Didnot fill in" : compliance_desc,
        compliance_officer,
        compliance_partner,
        compliance_partner_name:
          compliance_partner == "no"
            ? "Didnot fill in"
            : compliance_partner_name,
        compliance_group,
        onsite_inspection,
        compliance_date,
        frequency_compliance,
        compliance_trainning,
        operating_procedures,
      },
      Interested_Services: Interested_Services,
      // createdAt: date,
    });
    if (!filledApplication) {
      res.status(400);
      throw new Error("Error in filling the application");
    }

    const operatorID = req.user.id;
    const operator = await operatorModel.findById(operatorID);

    operator.formFilled = true;
    await operator.save();

    res.status(201).json({
      message: "Operator Filled Application Successfully",
      filledApplication,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});

// UPDATE
// Application Update
exports.updateApplication = asyncHandler(async (req, res) => {
  const { applicationID } = req.params;
  const operatorID = req.user.id;

  // Finding all applications of this operator
  const operatorApplications = await operatorApplicationModel.find({
    applicant_ID: operatorID,
  });
  if (operatorApplications.length == 0) {
    res.status(404);
    throw new Error("No applications found");
  }

  // Checking if this application id belongs to this operator
  const oneApplication = await operatorApplications.find(
    (application) => application.application_Id == applicationID
  );
  if (!oneApplication) {
    res.status(404);
    throw new Error("Your application id doesnot match with your system");
  }

  const id = oneApplication._id;
  const updatedApplication = await operatorApplicationModel.findByIdAndUpdate(
    id,
    req.body,
    {
      new: true,
    }
  );

  res.status(200).json({ message: "Application Updated", updatedApplication });
});

// DELETE
// Application Delete
exports.deleteApplication = asyncHandler(async (req, res) => {
  const { applicationID } = req.params;
  const operatorID = req.user.id;

  // Finding all applications of this operator
  const operatorApplications = await operatorApplicationModel.find({
    applicant_ID: operatorID,
  });
  if (operatorApplications.length == 0) {
    res.status(404);
    throw new Error("No applications found");
  }

  // Checking if this application id belongs to this operator
  const oneApplication = await operatorApplications.find(
    (application) => application.application_Id == applicationID
  );
  if (!oneApplication) {
    res.status(404);
    throw new Error("Your application id doesnot match with your system");
  }

  const id = oneApplication._id;
  const application = await operatorApplicationModel.findByIdAndDelete(id);
  if (!application) {
    res.status(404);
    throw new Error("No Application Found");
  }

  res.status(200).json({ message: "Application Deleted" });
});

// GET
// Applications List
exports.applicationList = asyncHandler(async (req, res) => {
  const operatorID = req.user.id;
  const applications = await operatorApplicationModel.find({
    applicant_ID: operatorID,
  });

  if (applications.length === 0) {
    res.status(404);
    throw new Error("No applications Found");
  }

  // Need proposal numbers with Rest application Details
  const applicationDetails = await Promise.all(
    applications.map(async (ele) => {
      const { application_Id, Legal_Business, createdAt, approved } = ele;

      const name = Legal_Business.name;
      const dba = Legal_Business.dba;

      // Proposal per application
      const proposal = await proposalRecievedModel.countDocuments({
        application_Id: application_Id,
      });

      return {
        application_Id,
        dba: dba == "" ? name : dba,
        createdAt,
        approved,
        proposal,
      };
    })
  );

  res.status(200).json(applicationDetails);
});

// GET
// Application Details
exports.applicationDetails = asyncHandler(async (req, res) => {
  const { applicationID } = req.params;
  const operatorID = req.user.id;

  const application = await operatorApplicationModel
    .findOne({
      $and: [{ applicant_ID: operatorID }, { application_Id: applicationID }],
    })
    .lean();
  if (!application) {
    res.status(404);
    throw new Error("No application found");
  }

  res.status(200).json(application);
});

// ----------------------------------------------------------- Operator Dashboard -----------------------------------------------------------

// GET
// Operator Dashboard
exports.dashboard = asyncHandler(async (req, res) => {
  const operatorID = req.user.id;

  //  Number of Application filled
  const activeApplications = await operatorApplicationModel.countDocuments({
    $and: [{ applicant_ID: operatorID }, { approved: false }],
  });
  // Number of proposals received
  const numProposalReceived = await proposalRecievedModel.countDocuments({
    applicant_ID: operatorID,
  });
  // Number of proposals accepted
  const numAccountOpened = await proposalRecievedModel.countDocuments({
    $and: [{ applicant_ID: operatorID }, { accountOpened: "Account Opened" }],
  });
  // Recent Proposals Recieved
  const recentProposalReceived = await proposalRecievedModel
    .find({ applicant_ID: operatorID })
    .limit(10)
    .sort({ _id: -1 });

  res.status(200).json({
    activeApplications,
    numProposalReceived,
    numAccountOpened,
    recentProposalReceived,
  });
});

// ----------------------------------------------------------- Operator Dashboard -----------------------------------------------------------

// GET
// All Operator Documentations
exports.documentations = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const documents = await operatorDocumentModel
    .find({ applicant_ID: id })
    .select("-applicant_ID");

  if (documents.length === 0) {
    res.status(404);
    throw new Error("No Documents Found");
  }

  res.status(200).json(documents);
});

// POST
// Operator Documentation Upload
exports.documentUpload = asyncHandler(async (req, res) => {
  const id = req.user.id;
  try {
    const { name } = req.body;
    const document = req.file;
    if (!document && !name) {
      res.status(400);
      throw new Error("Please select a document and a name for it");
    }

    const documents = await operatorDocumentModel.create({
      applicant_ID: id,
      name,
      document: document.location,
    });

    res.status(200).json({
      message: "Document Updated Successfully",
      documents,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
});
