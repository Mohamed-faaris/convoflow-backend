import mongoose from "mongoose";

const companyConfigSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  configData: {
    type: Object,
    required: true,
  },
});

const CompanyConfig = mongoose.model("CompanyConfig", companyConfigSchema);

export default CompanyConfig;
