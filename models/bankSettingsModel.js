const mongoose = require("mongoose");

const bankFormSchema = mongoose.Schema(
  {
    bank_ID: {
      type: mongoose.Schema.ObjectId,
      ref: "Bank",
    },
    servicesOffered: { type: Array },
    // Page 1
    acc_creation_time: {
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
    risk_classification: { type: Array },
    Legal_Business: {
      licensing_Type: { type: Array },
      num_employees_min: {
        type: Number,
        default: 0,
      },
      num_employees_max: {
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
      ownership_Percentage: {
        type: Number,
        default: 0,
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
      acc_need_min: {
        type: Number,
        default: 0,
      },
      acc_need_max: {
        type: Number,
        default: 0,
      },
      num_locs_min: {
        type: Number,
        default: 0,
      },
      num_locs_max: {
        type: Number,
        default: 0,
      },
      transactions_Per_month_min: {
        type: Number,
        default: 0,
      },
      transactions_Per_month_max: {
        type: Number,
        default: 0,
      },
      // managed_square_feet_min: {
      //   type: Number,
      //   default: 0,
      // },
      // managed_square_feet_max: {
      //   type: Number,
      //   default: 0,
      // },
      facility: {
        type: String,
        default: "",
      },
      types_customers: { type: Array },
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
      number_beneficial_owner_min: {
        type: Number,
        default: 0,
      },
      number_beneficial_owner_max: {
        type: Number,
        default: 0,
      },
    },
    Anticipated_Transaction_Activity: {
      amount_Initial_Deposit_min: {
        type: Number,
        default: 0,
      },
      amount_Initial_Deposit_max: {
        type: Number,
        default: 0,
      },
      estimated_total_amount_monthly_deposit_min: {
        type: Number,
        default: 0,
      },
      estimated_total_amount_monthly_deposit_max: {
        type: Number,
        default: 0,
      },
      estimated_total_num_monthly_deposit_min: {
        type: Number,
        default: 0,
      },
      estimated_total_num_monthly_deposit_max: {
        type: Number,
        default: 0,
      },
      anticipate_cash_deposits: {
        type: String,
        default: "",
      },
      amount_cash_deposits_min: {
        type: Number,
        default: 0,
      },
      amount_cash_deposits_max: {
        type: Number,
        default: 0,
      },
      frequency_cash_deposits: {
        type: Array,
      },
      estimated_spend_min: {
        type: Number,
        default: 0,
      },
      estimated_spend_max: {
        type: Number,
        default: 0,
      },
      anticipate_cash_withdrawals: {
        type: String,
        default: "",
      },
      amount_cash_withdrawals_min: {
        type: Number,
        default: 0,
      },
      amount_cash_withdrawals_max: {
        type: Number,
        default: 0,
      },
      frequency_cash_withdrawals: {
        type: Array,
      },
      monthly_payroll_min: {
        type: Number,
        default: 0,
      },
      monthly_payroll_max: {
        type: Number,
        default: 0,
      },
      cash_pick_ups: {
        type: String,
        default: "",
      },
      frequency_cash_pick_ups: {
        type: Array,
      },
      estimated_cash_pick_ups_min: {
        type: Number,
        default: 0,
      },
      estimated_cash_pick_ups_max: {
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
      number_vendors_min: {
        type: Number,
        default: 0,
      },
      number_vendors_max: {
        type: Number,
        default: 0,
      },
      vendor_payment_methods: { type: Array },
      international_vendor: {
        type: String,
        default: "",
      },
    },
    Transfer_Existing_Bank: {
      prev_bank_verified: {
        type: String,
        default: "",
      },
      prev_bank_aware: {
        type: String,
        default: "",
      },
    },
    active: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("BankSettings", bankFormSchema);
