const asyncHandler = require("express-async-handler");
// Models
// Bank
const bankModel = require("../models/bankModel");
const bankSettingsModel = require("../models/bankSettingsModel");
const applicationAcceptedModel = require("../models/applicationAcceptedModel");
const applicationDeclinedModel = require("../models/applicationDeclinedModel");
// Operator
const operatorApplicationModel = require("../models/operatorApplicationModel");
const proposalRecievedModel = require("../models/proposalRecievedModel");

// ----------------------------------------------------------- Matching Applications -----------------------------------------------------------

// Function
// List Fields Without Min Max
function listFieldsWithoutMinMax(obj, excludedFields = []) {
  const fieldsList = [];
  function gatherFields(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !excludedFields.includes(key)) {
        const value = obj[key];
        if (typeof value === "object" && !Array.isArray(value)) {
          gatherFields(value);
        } else {
          if (key.endsWith("_min") || key.endsWith("_max")) {
            const baseKey = key.substring(0, key.lastIndexOf("_"));
            if (!fieldsList.includes(baseKey)) {
              fieldsList.push(baseKey);
            }
          } else {
            fieldsList.push(key);
          }
        }
      }
    }
  }
  gatherFields(obj);
  return fieldsList;
}

// GET
// Match Bank Setting with Operator Application
exports.matchingApplications = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const bankSettings = await bankSettingsModel.findOne({ bank_ID: bankID });
  if (!bankSettings) {
    res.status(404);
    throw new Error("You havn't filled the bank settings yet");
  }
  // Destructuring BankSettings Objects
  const bank_acc_creation_time = bankSettings.acc_creation_time.convertedToDays;
  const bank_servicesOffered = bankSettings.servicesOffered;
  const bank_risk_classification = bankSettings.risk_classification;
  const bank_Legal_Business = bankSettings.Legal_Business;
  const bank_Primary_Information = bankSettings.Primary_Information;
  const bank_Operational_Details = bankSettings.Operational_Details;
  const bank_Other_Operational_Details = bankSettings.Other_Operational_Details;
  const bank_Anticipated_Transaction_Activity =
    bankSettings.Anticipated_Transaction_Activity;
  const bank_Company_Documentation = bankSettings.Company_Documentation;
  const bank_Legacy_Cash = bankSettings.Legacy_Cash;
  const bank_Cash_Management = bankSettings.Cash_Management;
  const bank_Transfer_Existing_Bank = bankSettings.Transfer_Existing_Bank;

  const bank = await bankModel.findById(bankID);
  let { percentage } = req.query;
  // If bank don't select any percentage from dropdown then by default percentage will select from main settings
  if (!percentage) {
    percentage = bank.matchedApplicationPercentage;
  }
  const bankActiveStatus = bank.matchedApplicationStatus;

  // Check if Admin has given permission for bank to match applications
  if (bankActiveStatus === false) {
    res.status(200).json({
      bankActiveStatus,
      message: "Please wait, Your account is under review",
    });
  }
  // Check if Bank has it's match active status on
  else if (bank.isActive === false) {
    res.status(200).json({
      bankActiveStatus,
      message: "Cannot match, Your match active status is off",
    });
  }
  // If both are true then show match applications
  else {
    // Accepted Applications
    const acceptedApplicationIds = await applicationAcceptedModel.find(
      {},
      "application_Id"
    );

    // Declined Applications
    const declinedApplicationIds = await applicationDeclinedModel.find(
      {},
      "application_Id"
    );

    // Extract application IDs from the result objects
    const acceptedIds = acceptedApplicationIds.map((app) => app.application_Id);
    const declinedIds = declinedApplicationIds.map((app) => app.application_Id);

    // Find those appllication that are not accepted and not declined by Bank
    const applications = await operatorApplicationModel.find({
      application_Id: { $nin: [...acceptedIds, ...declinedIds] },
      $and: [
        { approved: false },
        { "Primary_Information.us_Citizenship": "yes" },
      ],
    });

    const excludedFields = [
      "input",
      "unit",
      "other",
      "lengthTimeInput",
      "lengthTimeUnit",
      "createdAt",
      "active",
    ];
    const fieldsWithoutMinMax = listFieldsWithoutMinMax(
      bankSettings._doc,
      excludedFields
    );
    const fieldCount = fieldsWithoutMinMax.length;
    // console.log("Fields after removing _min and _max:");
    // console.log(fieldsWithoutMinMax);
    // console.log(`Total fields: ${fieldCount}`);
    const counts = {};
    applications.forEach((application) => {
      // Destructuring Operator Applications Objects
      // const acc_need_time = application.acc_need_time;
      const acc_need_time = application.acc_need_time.convertedToDays;
      const servicesWanted = application.servicesWanted;
      const risk_classification = application.risk_classification;
      const Legal_Business = application.Legal_Business;
      const Primary_Information = application.Primary_Information;
      const Operational_Details = application.Operational_Details;
      const Other_Operational_Details = application.Other_Operational_Details;
      const Anticipated_Transaction_Activity =
        application.Anticipated_Transaction_Activity;
      const Company_Documentation = application.Company_Documentation;
      const Legacy_Cash = application.Legacy_Cash;
      const Cash_Management = application.Cash_Management;
      const Transfer_Existing_Bank = application.Transfer_Existing_Bank;

      // Storing Must match values here ->
      const accountOpenTimeMatch = acc_need_time >= bank_acc_creation_time;
      // const serviceMatch = bank_servicesOffered.some((service) =>
      //   servicesWanted.includes(service)
      // );
      const serviceMatch = bank_servicesOffered.some((e) =>
        servicesWanted.includes(e.service)
      );

      if (accountOpenTimeMatch && serviceMatch) {
        // Starting count from 0
        counts[application.application_Id] = 0;
        // -----------------------------------------------------------------------------
        if (serviceMatch) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (accountOpenTimeMatch) {
          counts[application.application_Id]++;
        }
        //
        if (bank_risk_classification.includes(risk_classification)) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (
          Legal_Business.license.some((ele) =>
            bank_Legal_Business.licensing_Type.includes(ele.licensing_Type)
          )
        ) {
          counts[application.application_Id]++;
        }
        if (
          Legal_Business.num_employees >=
            bank_Legal_Business.num_employees_min &&
          Legal_Business.num_employees <= bank_Legal_Business.num_employees_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          bank_Legal_Business.accepted_states.some((state) =>
            Legal_Business.accepted_states.includes(state)
          )
        ) {
          counts[application.application_Id]++;
        }
        if (
          Legal_Business.foreign_operations ===
          bank_Legal_Business.foreign_operations
        ) {
          counts[application.application_Id]++;
        }
        if (
          Primary_Information.ownership_Percentage >=
          bank_Primary_Information.ownership_Percentage
        ) {
          counts[application.application_Id]++;
        }
        if (
          Primary_Information.us_Citizenship ===
          bank_Primary_Information.us_Citizenship
        ) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (
          Operational_Details.products_purchased_providers ===
          bank_Operational_Details.products_purchased_providers
        ) {
          counts[application.application_Id]++;
        }
        if (
          Operational_Details.licensed_provider ===
          bank_Operational_Details.licensed_provider
        ) {
          counts[application.application_Id]++;
        }
        if (
          Operational_Details.acc_need >=
            bank_Operational_Details.acc_need_min &&
          Operational_Details.acc_need <= bank_Operational_Details.acc_need_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          Operational_Details.num_locs >=
            bank_Operational_Details.num_locs_min &&
          Operational_Details.num_locs <= bank_Operational_Details.num_locs_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          Operational_Details.transactions_Per_month >=
            bank_Operational_Details.transactions_Per_month_min &&
          Operational_Details.transactions_Per_month <=
            bank_Operational_Details.transactions_Per_month_max
        ) {
          counts[application.application_Id]++;
        }
        // if (
        //   Operational_Details.managed_square_feet >=
        //     bank_Operational_Details.managed_square_feet_min &&
        //   Operational_Details.managed_square_feet <=
        //     bank_Operational_Details.managed_square_feet_max
        // ) {
        //   counts[application.application_Id]++;
        // }
        if (
          Operational_Details.facility === bank_Operational_Details.facility
        ) {
          counts[application.application_Id]++;
        }
        if (
          bank_Operational_Details.types_customers.some((state) =>
            Operational_Details.types_customers.includes(state)
          )
        ) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (
          Other_Operational_Details.principal_business ===
          bank_Other_Operational_Details.principal_business
        ) {
          counts[application.application_Id]++;
        }
        if (
          Other_Operational_Details.beneficial_owners ===
          bank_Other_Operational_Details.beneficial_owners
        ) {
          counts[application.application_Id]++;
        }
        if (
          Other_Operational_Details.number_beneficial_owner >=
            bank_Other_Operational_Details.number_beneficial_owner_min &&
          Other_Operational_Details.number_beneficial_owner <=
            bank_Other_Operational_Details.number_beneficial_owner_max
        ) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (
          Anticipated_Transaction_Activity.amount_Initial_Deposit >=
            bank_Anticipated_Transaction_Activity.amount_Initial_Deposit_min &&
          Anticipated_Transaction_Activity.amount_Initial_Deposit <=
            bank_Anticipated_Transaction_Activity.amount_Initial_Deposit_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit >=
            bank_Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit_min &&
          Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit <=
            bank_Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit >=
            bank_Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit_min &&
          Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit <=
            bank_Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.anticipate_cash_deposits ===
          bank_Anticipated_Transaction_Activity.anticipate_cash_deposits
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.amount_cash_deposits >=
            bank_Anticipated_Transaction_Activity.amount_cash_deposits_min &&
          Anticipated_Transaction_Activity.amount_cash_deposits <=
            bank_Anticipated_Transaction_Activity.amount_cash_deposits_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          bank_Anticipated_Transaction_Activity.frequency_cash_deposits.includes(
            Anticipated_Transaction_Activity.frequency_cash_deposits
          )
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.estimated_spend >=
            bank_Anticipated_Transaction_Activity.estimated_spend_min &&
          Anticipated_Transaction_Activity.estimated_spend <=
            bank_Anticipated_Transaction_Activity.estimated_spend_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.anticipate_cash_withdrawals ===
          bank_Anticipated_Transaction_Activity.anticipate_cash_withdrawals
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.amount_cash_withdrawals >=
            bank_Anticipated_Transaction_Activity.amount_cash_withdrawals_min &&
          Anticipated_Transaction_Activity.amount_cash_withdrawals <=
            bank_Anticipated_Transaction_Activity.amount_cash_withdrawals_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          bank_Anticipated_Transaction_Activity.frequency_cash_withdrawals.includes(
            Anticipated_Transaction_Activity.frequency_cash_withdrawals
          )
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.monthly_payroll >=
            bank_Anticipated_Transaction_Activity.monthly_payroll_min &&
          Anticipated_Transaction_Activity.monthly_payroll <=
            bank_Anticipated_Transaction_Activity.monthly_payroll_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.cash_pick_ups ===
          bank_Anticipated_Transaction_Activity.cash_pick_ups
        ) {
          counts[application.application_Id]++;
        }
        if (
          bank_Anticipated_Transaction_Activity.frequency_cash_pick_ups.includes(
            Anticipated_Transaction_Activity.frequency_cash_pick_ups
          )
        ) {
          counts[application.application_Id]++;
        }
        if (
          Anticipated_Transaction_Activity.estimated_cash_pick_ups >=
            bank_Anticipated_Transaction_Activity.estimated_cash_pick_ups_min &&
          Anticipated_Transaction_Activity.estimated_cash_pick_ups <=
            bank_Anticipated_Transaction_Activity.estimated_cash_pick_ups_max
        ) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (
          bank_Company_Documentation.some((docs) =>
            Company_Documentation.includes(docs)
          )
        ) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (Legacy_Cash.legacy_cash === bank_Legacy_Cash.legacy_cash) {
          counts[application.application_Id]++;
        }
        if (
          bank_Legacy_Cash.documents_available.some((docs) =>
            Legacy_Cash.documents_available.includes(docs)
          )
        ) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (
          Cash_Management.business_acc === bank_Cash_Management.business_acc
        ) {
          counts[application.application_Id]++;
        }
        if (
          Cash_Management.length_time.lengthTimeConvertedToDays <=
          bank_Cash_Management.length_time.lengthTimeConvertedToDays
        ) {
          counts[application.application_Id]++;
        }
        // if (
        //   Cash_Management.payroll_service ===
        //   bank_Cash_Management.payroll_service
        // ) {
        //   counts[application.application_Id]++;
        // }
        // if (Cash_Management.paid_cash === bank_Cash_Management.paid_cash) {
        //   counts[application.application_Id]++;
        // }
        // if (
        //   Cash_Management.payroll_accepted ===
        //   bank_Cash_Management.payroll_accepted
        // ) {
        //   counts[application.application_Id]++;
        // }
        // if (Cash_Management.taxes_cash === bank_Cash_Management.taxes_cash) {
        //   counts[application.application_Id]++;
        // }
        if (
          Cash_Management.penalty_cash === bank_Cash_Management.penalty_cash
        ) {
          counts[application.application_Id]++;
        }
        if (Cash_Management.tax_payment === bank_Cash_Management.tax_payment) {
          counts[application.application_Id]++;
        }
        if (
          Cash_Management.number_vendors >=
            bank_Cash_Management.number_vendors_min &&
          Cash_Management.number_vendors <=
            bank_Cash_Management.number_vendors_max
        ) {
          counts[application.application_Id]++;
        }
        if (
          bank_Cash_Management.vendor_payment_methods.some((method) =>
            Cash_Management.vendor_payment_methods.includes(method)
          )
        ) {
          counts[application.application_Id]++;
        }
        if (
          Cash_Management.international_vendor ===
          bank_Cash_Management.international_vendor
        ) {
          counts[application.application_Id]++;
        }
        // -----------------------------------------------------------------------------
        if (
          Transfer_Existing_Bank.prev_bank_verified ===
          bank_Transfer_Existing_Bank.prev_bank_verified
        ) {
          counts[application.application_Id]++;
        }
        if (
          Transfer_Existing_Bank.prev_bank_aware ===
          bank_Transfer_Existing_Bank.prev_bank_aware
        ) {
          counts[application.application_Id]++;
        }
      }
    });

    let result = [];
    // loop for calculating match percentages
    for (const application_Id in counts) {
      const matchedCount = counts[application_Id];

      const application = applications.find(
        (form) => form.application_Id === application_Id
      );
      if (application) {
        const matchPercentage = (matchedCount / fieldCount) * 100;
        const matchedPercentage = Math.floor(matchPercentage);
        const acc_need_time = application.acc_need_time.convertedToDays;
        const licensingType = application.Legal_Business.license.map(
          (e) => e.licensing_Type
        );
        const servicesWanted = application.servicesWanted;
        const interestedServices = application.Interested_Services;
        result.push({
          application_Id,
          matchedPercentage,
          acc_need_time,
          licensingType,
          servicesWanted,
          interestedServices,
        });
      }
    }

    // Filter with percentage then sort by ascending order as the final result
    const resultAfterFilterAndSort = result
      .filter((ele) => ele.matchedPercentage >= percentage)
      .sort((a, b) => b.matchedPercentage - a.matchedPercentage);

    // Matched Application Count
    const matchResultCount = result.length;

    res.status(200).json({
      bankActiveStatus,
      matchResultCount,
      matchRestult: resultAfterFilterAndSort,
    });
  }
});

// GET
// Matched Application Details with Matched and UnMatched Fields
exports.matchApplicationsDetails = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const bankSettings = await bankSettingsModel.findOne({ bank_ID: bankID });
  if (!bankSettings) {
    res.status(404);
    throw new Error("You havn't filled the bank settings yet");
  }
  // Destructuring BankSettings Objects
  const bank_acc_creation_time = bankSettings.acc_creation_time.convertedToDays;
  const bank_servicesOffered = bankSettings.servicesOffered;
  const bank_risk_classification = bankSettings.risk_classification;
  const bank_Legal_Business = bankSettings.Legal_Business;
  const bank_Primary_Information = bankSettings.Primary_Information;
  const bank_Operational_Details = bankSettings.Operational_Details;
  const bank_Other_Operational_Details = bankSettings.Other_Operational_Details;
  const bank_Anticipated_Transaction_Activity =
    bankSettings.Anticipated_Transaction_Activity;
  const bank_Company_Documentation = bankSettings.Company_Documentation;
  const bank_Legacy_Cash = bankSettings.Legacy_Cash;
  const bank_Cash_Management = bankSettings.Cash_Management;
  const bank_Transfer_Existing_Bank = bankSettings.Transfer_Existing_Bank;

  const { id } = req.params;
  const application = await operatorApplicationModel
    .findOne({ application_Id: id })
    .lean();
  if (!application) {
    res.status(404);
    throw new Error("No application Found");
  }
  // Destructuring Operator Applications Objects
  const acc_need_time = application.acc_need_time.convertedToDays;
  const servicesWanted = application.servicesWanted;
  const accountPurpose = application.accountPurpose;
  const risk_classification = application.risk_classification;
  const Legal_Business = application.Legal_Business;
  const Primary_Information = application.Primary_Information;
  const Operational_Details = application.Operational_Details;
  const Other_Operational_Details = application.Other_Operational_Details;
  const Anticipated_Transaction_Activity =
    application.Anticipated_Transaction_Activity;
  const Company_Documentation = application.Company_Documentation;
  const Legacy_Cash = application.Legacy_Cash;
  const Cash_Management = application.Cash_Management;
  const Transfer_Existing_Bank = application.Transfer_Existing_Bank;
  const Electronic_Payments_Settlement =
    application.Electronic_Payments_Settlement;
  const ATM_Machine = application.ATM_Machine;
  const Accounting = application.Accounting;
  const Compliance_Details = application.Compliance_Details;
  const Interested_Services = application.Interested_Services;
  const approved = application.approved;

  const allFields = {
    acc_need_time,
    servicesWanted,
    accountPurpose,
    risk_classification,
    Legal_Business: {
      license: Legal_Business.license.map((e) => {
        return { licensing_Type: e.licensing_Type };
      }),
      num_employees: Legal_Business.num_employees,
      accepted_states: Legal_Business.accepted_states,
      foreign_operations: Legal_Business.foreign_operations,
    },
    Primary_Information: {
      ownership: Primary_Information.ownership,
      ownership_Percentage: Primary_Information.ownership_Percentage,
      authority_sign: Primary_Information.authority_sign,
      us_Citizenship: Primary_Information.us_Citizenship,
    },
    Operational_Details: {
      products_purchased_providers:
        Operational_Details.products_purchased_providers,
      licensed_provider: Operational_Details.licensed_provider,
      acc_need: Operational_Details.acc_need,
      num_locs: Operational_Details.num_locs,
      transactions_Per_month: Operational_Details.transactions_Per_month,
      purchase_amount_per_sale: Operational_Details.purchase_amount_per_sale,
      num_plants: Operational_Details.num_plants,
      average_quantity_per_sale: Operational_Details.average_quantity_per_sale,
      facility: Operational_Details.facility,
      lease_term: Operational_Details.lease_term,
      egmi: Operational_Details.egmi,
      types_customers: Operational_Details.types_customers,
    },
    Other_Operational_Details: {
      principal_business: Other_Operational_Details.principal_business,
      beneficial_owners: Other_Operational_Details.beneficial_owners,
      number_beneficial_owner:
        Other_Operational_Details.number_beneficial_owner,
    },
    Anticipated_Transaction_Activity: {
      amount_Initial_Deposit:
        Anticipated_Transaction_Activity.amount_Initial_Deposit,
      source_Initial_Deposit:
        Anticipated_Transaction_Activity.source_Initial_Deposit,
      estimated_total_amount_monthly_deposit:
        Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit,
      estimated_total_num_monthly_deposit:
        Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit,
      anticipate_cash_deposits:
        Anticipated_Transaction_Activity.anticipate_cash_deposits,
      amount_cash_deposits:
        Anticipated_Transaction_Activity.amount_cash_deposits,
      frequency_cash_deposits:
        Anticipated_Transaction_Activity.frequency_cash_deposits,
      estimated_spend: Anticipated_Transaction_Activity.estimated_spend,
      anticipate_cash_withdrawals:
        Anticipated_Transaction_Activity.anticipate_cash_withdrawals,
      amount_cash_withdrawals:
        Anticipated_Transaction_Activity.amount_cash_withdrawals,
      frequency_cash_withdrawals:
        Anticipated_Transaction_Activity.frequency_cash_withdrawals,
      monthly_payroll: Anticipated_Transaction_Activity.monthly_payroll,
      cash_pick_ups: Anticipated_Transaction_Activity.cash_pick_ups,
      frequency_cash_pick_ups:
        Anticipated_Transaction_Activity.frequency_cash_pick_ups,
      estimated_cash_pick_ups:
        Anticipated_Transaction_Activity.estimated_cash_pick_ups,
    },
    Company_Documentation,
    Legacy_Cash: {
      legacy_cash: Legacy_Cash.legacy_cash,
      documents_available: Legacy_Cash.documents_available,
    },
    Cash_Management: {
      business_acc: Cash_Management.business_acc,
      length_time: Cash_Management.length_time,
      reason_to_close: Cash_Management.reason_to_close,
      // payroll_service: Cash_Management.payroll_service,
      // paid_cash: Cash_Management.paid_cash,
      // payroll_accepted: Cash_Management.payroll_accepted,
      // taxes_cash: Cash_Management.taxes_cash,
      penalty_cash: Cash_Management.penalty_cash,
      tax_payment: Cash_Management.tax_payment,
      number_vendors: Cash_Management.number_vendors,
      vendor_payment_methods: Cash_Management.vendor_payment_methods,
      international_vendor: Cash_Management.international_vendor,
      electronic_payment: Cash_Management.electronic_payment,
      current_cash_managment: Cash_Management.current_cash_managment,
    },
    Transfer_Existing_Bank: {
      prev_bank_verified: Transfer_Existing_Bank.prev_bank_verified,
      prev_bank_aware: Transfer_Existing_Bank.prev_bank_aware,
    },
    Electronic_Payments_Settlement,
    ATM_Machine,
    Accounting,
    Compliance_Details,
    Interested_Services,
    approved,
  };

  const matchedFields = [];
  const unmatchedFields = [];

  if (acc_need_time >= bank_acc_creation_time) {
    matchedFields.push({
      acc_need_time: acc_need_time,
    });
  } else {
    unmatchedFields.push({
      acc_need_time: acc_need_time,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    // bank_servicesOffered.some((service) => servicesWanted.includes(service))
    bank_servicesOffered.some((ele) => servicesWanted.includes(ele.service))
  ) {
    matchedFields.push({
      servicesWanted: servicesWanted,
    });
  } else {
    unmatchedFields.push({
      servicesWanted: servicesWanted,
    });
  }
  // -----------------------------------------------------------------------------
  if (bank_risk_classification.includes(risk_classification)) {
    matchedFields.push({
      risk_classification: risk_classification,
    });
  } else {
    unmatchedFields.push({
      risk_classification: risk_classification,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    Legal_Business.license.some((ele) =>
      bank_Legal_Business.licensing_Type.includes(ele.licensing_Type)
    )
  ) {
    matchedFields.push({
      licensing_Type: Legal_Business.license.map((e) => e.licensing_Type),
    });
  } else {
    unmatchedFields.push({
      licensing_Type: Legal_Business.license.map((e) => e.licensing_Type),
    });
  }
  if (
    Legal_Business.num_employees >= bank_Legal_Business.num_employees_min &&
    Legal_Business.num_employees <= bank_Legal_Business.num_employees_max
  ) {
    matchedFields.push({
      num_employees: Legal_Business.num_employees,
    });
  } else {
    unmatchedFields.push({
      num_employees: Legal_Business.num_employees,
    });
  }
  if (
    bank_Legal_Business.accepted_states.some((state) =>
      Legal_Business.accepted_states.includes(state)
    )
  ) {
    matchedFields.push({
      accepted_states: Legal_Business.accepted_states,
    });
  } else {
    unmatchedFields.push({
      accepted_states: Legal_Business.accepted_states,
    });
  }
  if (
    Legal_Business.foreign_operations === bank_Legal_Business.foreign_operations
  ) {
    matchedFields.push({
      foreign_operations: Legal_Business.foreign_operations,
    });
  } else {
    unmatchedFields.push({
      foreign_operations: Legal_Business.foreign_operations,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    Primary_Information.ownership_Percentage >=
    bank_Primary_Information.ownership_Percentage
  ) {
    matchedFields.push({
      ownership_Percentage: Primary_Information.ownership_Percentage,
    });
  } else {
    unmatchedFields.push({
      ownership_Percentage: Primary_Information.ownership_Percentage,
    });
  }
  if (
    Primary_Information.us_Citizenship ===
    bank_Primary_Information.us_Citizenship
  ) {
    matchedFields.push({
      us_Citizenship: Primary_Information.us_Citizenship,
    });
  } else {
    unmatchedFields.push({
      us_Citizenship: Primary_Information.us_Citizenship,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    Operational_Details.products_purchased_providers ===
    bank_Operational_Details.products_purchased_providers
  ) {
    matchedFields.push({
      products_purchased_providers:
        Operational_Details.products_purchased_providers,
    });
  } else {
    unmatchedFields.push({
      products_purchased_providers:
        Operational_Details.products_purchased_providers,
    });
  }
  if (
    Operational_Details.licensed_provider ===
    bank_Operational_Details.licensed_provider
  ) {
    matchedFields.push({
      licensed_provider: Operational_Details.licensed_provider,
    });
  } else {
    unmatchedFields.push({
      licensed_provider: Operational_Details.licensed_provider,
    });
  }
  if (
    Operational_Details.acc_need >= bank_Operational_Details.acc_need_min &&
    Operational_Details.acc_need <= bank_Operational_Details.acc_need_max
  ) {
    matchedFields.push({
      acc_need: Operational_Details.acc_need,
    });
  } else {
    unmatchedFields.push({
      acc_need: Operational_Details.acc_need,
    });
  }
  if (
    Operational_Details.num_locs >= bank_Operational_Details.num_locs_min &&
    Operational_Details.num_locs <= bank_Operational_Details.num_locs_max
  ) {
    matchedFields.push({
      num_locs: Operational_Details.num_locs,
    });
  } else {
    unmatchedFields.push({
      num_locs: Operational_Details.num_locs,
    });
  }
  if (
    Operational_Details.transactions_Per_month >=
      bank_Operational_Details.transactions_Per_month_min &&
    Operational_Details.transactions_Per_month <=
      bank_Operational_Details.transactions_Per_month_max
  ) {
    matchedFields.push({
      transactions_Per_month: Operational_Details.transactions_Per_month,
    });
  } else {
    unmatchedFields.push({
      transactions_Per_month: Operational_Details.transactions_Per_month,
    });
  }
  if (Operational_Details.facility === bank_Operational_Details.facility) {
    matchedFields.push({
      facility: Operational_Details.facility,
    });
  } else {
    unmatchedFields.push({
      facility: Operational_Details.facility,
    });
  }
  if (
    bank_Operational_Details.types_customers.some((state) =>
      Operational_Details.types_customers.includes(state)
    )
  ) {
    matchedFields.push({
      types_customers: Operational_Details.types_customers,
    });
  } else {
    unmatchedFields.push({
      types_customers: Operational_Details.types_customers,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    Other_Operational_Details.principal_business ===
    bank_Other_Operational_Details.principal_business
  ) {
    matchedFields.push({
      principal_business: Other_Operational_Details.principal_business,
    });
  } else {
    unmatchedFields.push({
      principal_business: Other_Operational_Details.principal_business,
    });
  }
  if (
    Other_Operational_Details.beneficial_owners ===
    bank_Other_Operational_Details.beneficial_owners
  ) {
    matchedFields.push({
      beneficial_owners: Other_Operational_Details.beneficial_owners,
    });
  } else {
    unmatchedFields.push({
      beneficial_owners: Other_Operational_Details.beneficial_owners,
    });
  }
  if (
    Other_Operational_Details.number_beneficial_owner >=
      bank_Other_Operational_Details.number_beneficial_owner_min &&
    Other_Operational_Details.number_beneficial_owner <=
      bank_Other_Operational_Details.number_beneficial_owner_max
  ) {
    matchedFields.push({
      number_beneficial_owner:
        Other_Operational_Details.number_beneficial_owner,
    });
  } else {
    unmatchedFields.push({
      number_beneficial_owner:
        Other_Operational_Details.number_beneficial_owner,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    Anticipated_Transaction_Activity.amount_Initial_Deposit >=
      bank_Anticipated_Transaction_Activity.amount_Initial_Deposit_min &&
    Anticipated_Transaction_Activity.amount_Initial_Deposit <=
      bank_Anticipated_Transaction_Activity.amount_Initial_Deposit_max
  ) {
    matchedFields.push({
      amount_Initial_Deposit:
        Anticipated_Transaction_Activity.amount_Initial_Deposit,
    });
  } else {
    unmatchedFields.push({
      amount_Initial_Deposit:
        Anticipated_Transaction_Activity.amount_Initial_Deposit,
    });
  }
  if (
    Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit >=
      bank_Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit_min &&
    Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit <=
      bank_Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit_max
  ) {
    matchedFields.push({
      estimated_total_amount_monthly_deposit:
        Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit,
    });
  } else {
    unmatchedFields.push({
      estimated_total_amount_monthly_deposit:
        Anticipated_Transaction_Activity.estimated_total_amount_monthly_deposit,
    });
  }
  if (
    Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit >=
      bank_Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit_min &&
    Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit <=
      bank_Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit_max
  ) {
    matchedFields.push({
      estimated_total_num_monthly_deposit:
        Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit,
    });
  } else {
    unmatchedFields.push({
      estimated_total_num_monthly_deposit:
        Anticipated_Transaction_Activity.estimated_total_num_monthly_deposit,
    });
  }
  if (
    Anticipated_Transaction_Activity.anticipate_cash_deposits ===
    bank_Anticipated_Transaction_Activity.anticipate_cash_deposits
  ) {
    matchedFields.push({
      anticipate_cash_deposits:
        Anticipated_Transaction_Activity.anticipate_cash_deposits,
    });
  } else {
    unmatchedFields.push({
      anticipate_cash_deposits:
        Anticipated_Transaction_Activity.anticipate_cash_deposits,
    });
  }
  if (
    Anticipated_Transaction_Activity.amount_cash_deposits >=
      bank_Anticipated_Transaction_Activity.amount_cash_deposits_min &&
    Anticipated_Transaction_Activity.amount_cash_deposits <=
      bank_Anticipated_Transaction_Activity.amount_cash_deposits_max
  ) {
    matchedFields.push({
      amount_cash_deposits:
        Anticipated_Transaction_Activity.amount_cash_deposits,
    });
  } else {
    unmatchedFields.push({
      amount_cash_deposits:
        Anticipated_Transaction_Activity.amount_cash_deposits,
    });
  }
  if (
    bank_Anticipated_Transaction_Activity.frequency_cash_deposits.includes(
      Anticipated_Transaction_Activity.frequency_cash_deposits
    )
  ) {
    matchedFields.push({
      frequency_cash_deposits:
        Anticipated_Transaction_Activity.frequency_cash_deposits,
    });
  } else {
    unmatchedFields.push({
      frequency_cash_deposits:
        Anticipated_Transaction_Activity.frequency_cash_deposits,
    });
  }
  if (
    Anticipated_Transaction_Activity.estimated_spend >=
      bank_Anticipated_Transaction_Activity.estimated_spend_min &&
    Anticipated_Transaction_Activity.estimated_spend <=
      bank_Anticipated_Transaction_Activity.estimated_spend_max
  ) {
    matchedFields.push({
      estimated_spend: Anticipated_Transaction_Activity.estimated_spend,
    });
  } else {
    unmatchedFields.push({
      estimated_spend: Anticipated_Transaction_Activity.estimated_spend,
    });
  }
  if (
    Anticipated_Transaction_Activity.anticipate_cash_withdrawals ===
    bank_Anticipated_Transaction_Activity.anticipate_cash_withdrawals
  ) {
    matchedFields.push({
      anticipate_cash_withdrawals:
        Anticipated_Transaction_Activity.anticipate_cash_withdrawals,
    });
  } else {
    unmatchedFields.push({
      anticipate_cash_withdrawals:
        Anticipated_Transaction_Activity.anticipate_cash_withdrawals,
    });
  }
  if (
    Anticipated_Transaction_Activity.amount_cash_withdrawals >=
      bank_Anticipated_Transaction_Activity.amount_cash_withdrawals_min &&
    Anticipated_Transaction_Activity.amount_cash_withdrawals <=
      bank_Anticipated_Transaction_Activity.amount_cash_withdrawals_max
  ) {
    matchedFields.push({
      amount_cash_withdrawals:
        Anticipated_Transaction_Activity.amount_cash_withdrawals,
    });
  } else {
    unmatchedFields.push({
      amount_cash_withdrawals:
        Anticipated_Transaction_Activity.amount_cash_withdrawals,
    });
  }
  if (
    bank_Anticipated_Transaction_Activity.frequency_cash_withdrawals.includes(
      Anticipated_Transaction_Activity.frequency_cash_withdrawals
    )
  ) {
    matchedFields.push({
      frequency_cash_withdrawals:
        Anticipated_Transaction_Activity.frequency_cash_withdrawals,
    });
  } else {
    unmatchedFields.push({
      frequency_cash_withdrawals:
        Anticipated_Transaction_Activity.frequency_cash_withdrawals,
    });
  }
  if (
    Anticipated_Transaction_Activity.monthly_payroll >=
      bank_Anticipated_Transaction_Activity.monthly_payroll_min &&
    Anticipated_Transaction_Activity.monthly_payroll <=
      bank_Anticipated_Transaction_Activity.monthly_payroll_max
  ) {
    matchedFields.push({
      monthly_payroll: Anticipated_Transaction_Activity.monthly_payroll,
    });
  } else {
    unmatchedFields.push({
      monthly_payroll: Anticipated_Transaction_Activity.monthly_payroll,
    });
  }
  if (
    Anticipated_Transaction_Activity.cash_pick_ups ===
    bank_Anticipated_Transaction_Activity.cash_pick_ups
  ) {
    matchedFields.push({
      cash_pick_ups: Anticipated_Transaction_Activity.cash_pick_ups,
    });
  } else {
    unmatchedFields.push({
      cash_pick_ups: Anticipated_Transaction_Activity.cash_pick_ups,
    });
  }
  if (
    bank_Anticipated_Transaction_Activity.frequency_cash_pick_ups.includes(
      Anticipated_Transaction_Activity.frequency_cash_pick_ups
    )
  ) {
    matchedFields.push({
      frequency_cash_pick_ups:
        Anticipated_Transaction_Activity.frequency_cash_pick_ups,
    });
  } else {
    unmatchedFields.push({
      frequency_cash_pick_ups:
        Anticipated_Transaction_Activity.frequency_cash_pick_ups,
    });
  }
  if (
    Anticipated_Transaction_Activity.estimated_cash_pick_ups >=
      bank_Anticipated_Transaction_Activity.estimated_cash_pick_ups_min &&
    Anticipated_Transaction_Activity.estimated_cash_pick_ups <=
      bank_Anticipated_Transaction_Activity.estimated_cash_pick_ups_max
  ) {
    matchedFields.push({
      estimated_cash_pick_ups:
        Anticipated_Transaction_Activity.estimated_cash_pick_ups,
    });
  } else {
    unmatchedFields.push({
      estimated_cash_pick_ups:
        Anticipated_Transaction_Activity.estimated_cash_pick_ups,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    bank_Company_Documentation.some((docs) =>
      Company_Documentation.includes(docs)
    )
  ) {
    matchedFields.push({
      Company_Documentation: Company_Documentation,
    });
  } else {
    unmatchedFields.push({
      Company_Documentation: Company_Documentation,
    });
  }
  // -----------------------------------------------------------------------------
  if (Legacy_Cash.legacy_cash === bank_Legacy_Cash.legacy_cash) {
    matchedFields.push({
      legacy_cash: Legacy_Cash.legacy_cash,
    });
  } else {
    unmatchedFields.push({
      legacy_cash: Legacy_Cash.legacy_cash,
    });
  }
  if (
    bank_Legacy_Cash.documents_available.some((docs) =>
      Legacy_Cash.documents_available.includes(docs)
    )
  ) {
    matchedFields.push({
      documents_available: Legacy_Cash.documents_available,
    });
  } else {
    unmatchedFields.push({
      documents_available: Legacy_Cash.documents_available,
    });
  }
  // -----------------------------------------------------------------------------
  if (Cash_Management.business_acc === bank_Cash_Management.business_acc) {
    matchedFields.push({
      business_acc: Cash_Management.business_acc,
    });
  } else {
    unmatchedFields.push({
      business_acc: Cash_Management.business_acc,
    });
  }
  // if (Cash_Management.length_time >= bank_Cash_Management.length_time) {
  //   matchedFields.push({
  //     length_time: Cash_Management.length_time,
  //   });
  // } else {
  //   unmatchedFields.push({
  //     length_time: Cash_Management.length_time,
  //   });
  // }
  if (
    Cash_Management.length_time.lengthTimeConvertedToDays <=
    bank_Cash_Management.length_time.lengthTimeConvertedToDays
  ) {
    matchedFields.push({
      lengthTimeInput: Cash_Management.length_time.lengthTimeInput,
    });
    matchedFields.push({
      lengthTimeUnit: Cash_Management.length_time.lengthTimeUnit,
    });
  } else {
    unmatchedFields.push({
      lengthTimeInput: Cash_Management.length_time.lengthTimeInput,
    });
    unmatchedFields.push({
      lengthTimeUnit: Cash_Management.length_time.lengthTimeUnit,
    });
  }
  // if (
  //   Cash_Management.payroll_service === bank_Cash_Management.payroll_service
  // ) {
  //   matchedFields.push({
  //     payroll_service: Cash_Management.payroll_service,
  //   });
  // } else {
  //   unmatchedFields.push({
  //     payroll_service: Cash_Management.payroll_service,
  //   });
  // }
  // if (Cash_Management.paid_cash === bank_Cash_Management.paid_cash) {
  //   matchedFields.push({
  //     paid_cash: Cash_Management.paid_cash,
  //   });
  // } else {
  //   unmatchedFields.push({
  //     paid_cash: Cash_Management.paid_cash,
  //   });
  // }
  // if (
  //   Cash_Management.payroll_accepted === bank_Cash_Management.payroll_accepted
  // ) {
  //   matchedFields.push({
  //     payroll_accepted: Cash_Management.payroll_accepted,
  //   });
  // } else {
  //   unmatchedFields.push({
  //     payroll_accepted: Cash_Management.payroll_accepted,
  //   });
  // }
  // if (Cash_Management.taxes_cash === bank_Cash_Management.taxes_cash) {
  //   matchedFields.push({
  //     taxes_cash: Cash_Management.taxes_cash,
  //   });
  // } else {
  //   unmatchedFields.push({
  //     taxes_cash: Cash_Management.taxes_cash,
  //   });
  // }
  if (Cash_Management.penalty_cash === bank_Cash_Management.penalty_cash) {
    matchedFields.push({
      penalty_cash: Cash_Management.penalty_cash,
    });
  } else {
    unmatchedFields.push({
      penalty_cash: Cash_Management.penalty_cash,
    });
  }
  if (Cash_Management.tax_payment === bank_Cash_Management.tax_payment) {
    matchedFields.push({
      tax_payment: Cash_Management.tax_payment,
    });
  } else {
    unmatchedFields.push({
      tax_payment: Cash_Management.tax_payment,
    });
  }
  if (
    Cash_Management.number_vendors >= bank_Cash_Management.number_vendors_min &&
    Cash_Management.number_vendors <= bank_Cash_Management.number_vendors_max
  ) {
    matchedFields.push({
      number_vendors: Cash_Management.number_vendors,
    });
  } else {
    unmatchedFields.push({
      number_vendors: Cash_Management.number_vendors,
    });
  }
  if (
    bank_Cash_Management.vendor_payment_methods.some((method) =>
      Cash_Management.vendor_payment_methods.includes(method)
    )
  ) {
    matchedFields.push({
      vendor_payment_methods: Cash_Management.vendor_payment_methods,
    });
  } else {
    unmatchedFields.push({
      vendor_payment_methods: Cash_Management.vendor_payment_methods,
    });
  }
  if (
    Cash_Management.international_vendor ===
    bank_Cash_Management.international_vendor
  ) {
    matchedFields.push({
      international_vendor: Cash_Management.international_vendor,
    });
  } else {
    unmatchedFields.push({
      international_vendor: Cash_Management.international_vendor,
    });
  }
  // -----------------------------------------------------------------------------
  if (
    Transfer_Existing_Bank.prev_bank_verified ===
    bank_Transfer_Existing_Bank.prev_bank_verified
  ) {
    matchedFields.push({
      prev_bank_verified: Transfer_Existing_Bank.prev_bank_verified,
    });
  } else {
    unmatchedFields.push({
      prev_bank_verified: Transfer_Existing_Bank.prev_bank_verified,
    });
  }
  if (
    Transfer_Existing_Bank.prev_bank_aware ===
    bank_Transfer_Existing_Bank.prev_bank_aware
  ) {
    matchedFields.push({
      prev_bank_aware: Transfer_Existing_Bank.prev_bank_aware,
    });
  } else {
    unmatchedFields.push({
      prev_bank_aware: Transfer_Existing_Bank.prev_bank_aware,
    });
  }
  // -----------------------------------------------------------------------------
  // Please find the applications to which a proposal has been sent.
  const proposalAccepted = await proposalRecievedModel.findOne({
    $and: [{ proposalID: bankID }, { application_Id: id }],
  });

  // Matched and Unmatched Field Count
  const matchedFieldsCount = matchedFields.length;
  const unmatchedFieldsCount = unmatchedFields.length;
  const totalFieldsCount = matchedFieldsCount + unmatchedFieldsCount;
  // Matched Percentage
  const matchPercentage = (matchedFieldsCount / totalFieldsCount) * 100;
  const matchedPercentage = Math.floor(matchPercentage);

  if (proposalAccepted) {
    res.status(200).json({
      message: "Proposal Accepted Application",
      matchedPercentage,
      allFields: application,
      // allFields,
      matchedFields,
      unmatchedFields,
    });
  } else {
    res.status(200).json({
      message: "Proposal not Accepted Application",
      matchedPercentage,
      allFields,
      // allFields: application,
      matchedFields,
      unmatchedFields,
    });
  }
});
