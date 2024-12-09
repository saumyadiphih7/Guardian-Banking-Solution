const mongoose = require("mongoose");
const validator = require("validator");

const operatorFormSchema = mongoose.Schema(
  {
    applicant_ID: {
      type: mongoose.Schema.ObjectId,
      ref: "Operator",
    },
    application_Id: {
      type: String,
    },
    // What services are you looking for ?
    servicesWanted: { type: Array },
    accountPurpose: { type: Array },
    // Page 1
    acc_need_time: {
      input: {
        type: Number,
        default: 0,
      },
      unit: {
        type: String,
        default: "",
      },
      convertedToDays: {
        type: Number,
        default: 0,
      },
    },
    risk_classification: {
      type: String,
      default: "",
    },
    Legal_Business: {
      name: {
        type: String,
        default: "",
      },
      dba: {
        type: String,
        default: "",
      },
      physical_Address: {
        type: String,
        default: "",
      },
      mailing_Address: {
        type: String,
        default: "",
      },
      federal_EIN: {
        type: String,
        default: "",
      },
      cannabis_License_Number: {
        type: String,
        default: "",
      },
      license: [
        {
          licensing_Type: {
            type: String,
            default: "",
          },
          license_Num: {
            type: String,
            default: "",
          },
        },
      ],
      num_employees: {
        type: Number,
        default: 0,
      },
      accepted_states: { type: Array },
      foreign_operations: {
        type: String,
        default: "",
      },
    },
    Primary_Information: {
      primary_contact_name: {
        type: String,
        default: "",
      },
      primary_address: {
        type: String,
        default: "",
      },
      dob: {
        type: Date,
        default: Date.now(),
      },
      mail: {
        type: String,
        validate: [validator.isEmail, "Please Enter Valid Email"],
      },
      primary_Phone: {
        type: String,
        default: "",
      },
      ownership: {
        type: String,
        default: "",
      },
      ownership_Percentage: {
        type: Number,
        default: 0,
      },
      authority_sign: {
        type: String,
        default: "",
      },
      us_Citizenship: {
        type: String,
        default: "",
      },
    },
    // Page 2
    Operational_Details: {
      products_purchased_providers: {
        type: String,
        default: "",
      },
      licensed_provider: {
        type: String,
        default: "",
      },
      acc_need: {
        type: Number,
        default: 0,
      },
      num_locs: {
        type: Number,
        default: 0,
      },
      transactions_Per_month: {
        type: Number,
        default: 0,
      },
      purchase_amount_per_sale: {
        type: Number,
        default: 0,
      },
      num_plants: {
        type: Number,
        default: 0,
      },
      average_quantity_per_sale: {
        quantityInput: {
          type: Number,
          default: 0,
        },
        quantityUnit: {
          type: String,
        },
        convertedToGram: {
          type: Number,
          default: 0,
        },
      },
      facility: {
        type: String,
        default: "",
      },
      lease_term: {
        type: String,
        default: "",
      },
      egmi: {
        type: Number,
        default: 0,
      },
      types_customers: {
        type: Array,
      },
    },
    Other_Operational_Details: {
      principal_business: {
        type: String,
        default: "",
      },
      beneficial_owners: {
        type: String,
        default: "",
      },
      number_beneficial_owner: {
        type: Number,
        default: 0,
      },
    },
    Additional_Locs: [
      {
        loc_name: {
          type: String,
          default: "",
        },
        license: {
          type: String,
          default: "",
        },
        loc_address: {
          type: String,
          default: "",
        },
        deposit_acc_need: {
          type: String,
          default: "",
        },
      },
    ],
    Anticipated_Transaction_Activity: {
      amount_Initial_Deposit: {
        type: Number,
        default: 0,
      },
      source_Initial_Deposit: {
        type: String,
        default: "",
      },
      estimated_total_amount_monthly_deposit: {
        type: Number,
        default: 0,
      },
      estimated_total_num_monthly_deposit: {
        type: Number,
        default: 0,
      },
      anticipate_cash_deposits: {
        type: String,
        default: "",
      },
      amount_cash_deposits: {
        type: Number,
        default: 0,
      },
      frequency_cash_deposits: {
        type: String,
        default: "",
      },
      estimated_spend: {
        type: Number,
        default: 0,
      },
      anticipate_cash_withdrawals: {
        type: String,
        default: "",
      },
      amount_cash_withdrawals: {
        type: Number,
        default: 0,
      },
      frequency_cash_withdrawals: {
        type: String,
        default: "",
      },
      monthly_payroll: {
        type: Number,
        default: 0,
      },
      cash_pick_ups: {
        type: String,
        default: "",
      },
      frequency_cash_pick_ups: {
        type: String,
        default: "",
      },
      estimated_cash_pick_ups: {
        type: Number,
        default: 0,
      },
    },
    // Page 3
    Company_Documentation: { type: Array },
    // Page 4
    Legacy_Cash: {
      legacy_cash: {
        type: String,
        default: "",
      },
      documents_available: { type: Array },
    },
    Cash_Management: {
      business_acc: {
        type: String,
        default: "",
      },
      bank_name: {
        type: String,
        default: "",
      },
      // length_time
      length_time: {
        lengthTimeInput: {
          type: Number,
          default: 0,
        },
        lengthTimeUnit: {
          type: String,
          default: "",
        },
        lengthTimeConvertedToDays: {
          type: Number,
          default: 0,
        },
      },
      reason_to_close: {
        type: String,
        default: "",
      },
      // payroll_service: {
      //   type: String,
      //   default: "",
      // },
      // paid_cash: {
      //   type: String,
      //   default: "",
      // },
      // payroll_accepted: {
      //   type: String,
      //   default: "",
      // },
      // taxes_cash: {
      //   type: String,
      //   default: "",
      // },
      penalty_cash: {
        type: String,
        default: "",
      },
      tax_payment: {
        type: String,
        default: "",
      },
      number_vendors: {
        type: Number,
        default: 0,
      },
      vendor_payment_methods: { type: Array },
      international_vendor: {
        type: String,
        default: "",
      },
      electronic_payment: {
        type: String,
        default: "",
      },
      current_cash_managment: {
        type: String,
        default: "",
      },
    },
    Transfer_Existing_Bank: {
      financial_institution: {
        type: String,
        default: "",
      },
      existing_bank_contact: {
        type: String,
        default: "",
      },
      existing_bank_name: {
        type: String,
        default: "",
      },
      original_deposite: {
        type: String,
        default: "",
      },
      prev_bank_verified: {
        type: String,
        default: "",
      },
      reason_closure: {
        type: String,
        default: "",
      },
      prev_bank_aware: {
        type: String,
        default: "",
      },
    },
    // Page 5
    Electronic_Payments_Settlement: {
      settlement_num_loc: {
        type: Number,
        default: 0,
      },
      msb: {
        type: String,
        default: "",
      },
      money_transmitted_license: {
        type: String,
        default: "",
      },
      types_payments: {
        type: Array,
      },
      mobile_app: {
        type: String,
        default: "",
      },
      pos: {
        type: String,
        default: "",
      },
      credit_card: {
        type: String,
        default: "",
      },
      bank_aware: {
        type: String,
        default: "",
      },
      merchant_processor: {
        type: String,
        default: "",
      },
      // merchant_processor_loc: {
      //   type: String,
      //   default:""
      // },
      // transaction_desc: {
      //   type: String,
      //   default:""
      // },
      // transaction_code: {
      //   type: String,
      //   default:""
      // },
      terminal: {
        type: String,
        default: "",
      },
    },
    ATM_Machine: {
      atm_own: {
        type: String,
        default: "",
      },
      atm_loc: {
        type: String,
        default: "",
      },
      atm_multiple: {
        type: String,
        default: "",
      },
      atm_fill: {
        type: String,
        default: "",
      },
      atm_third_party: {
        type: String,
        default: "",
      },
      atm_fill_company: {
        type: String,
        default: "",
      },
      atm_currency: {
        type: Number,
        default: 0,
      },
      atm_crypto: {
        type: String,
        default: "",
      },
      atm_deposite: {
        type: String,
        default: "",
      },
      atm_receipt: {
        type: String,
        default: "",
      },
    },
    Accounting: {
      accounting_system: {
        type: String,
        default: "",
      },
      accountant: {
        type: String,
        default: "",
      },
      firm_name: {
        type: String,
        default: "",
      },
    },
    Compliance_Details: {
      non_compliance: {
        type: String,
        default: "",
      },
      compliance_desc: {
        type: String,
        default: "",
      },
      compliance_officer: {
        type: String,
        default: "",
      },
      compliance_partner: {
        type: String,
        default: "",
      },
      compliance_partner_name: {
        type: String,
        default: "",
      },
      compliance_group: {
        type: String,
        default: "",
      },
      onsite_inspection: {
        type: String,
        default: "",
      },
      compliance_date: {
        type: Date,
        default: Date.now(),
      },
      frequency_compliance: {
        type: String,
        default: "",
      },
      compliance_trainning: {
        type: String,
        default: "",
      },
      operating_procedures: {
        type: String,
        default: "",
      },
    },
    Interested_Services: { type: Array },
    approved: {
      type: Boolean,
      default: false,
    },
    // createdAt: {
    //   type: String,
    // },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("OperatorApplications", operatorFormSchema);
