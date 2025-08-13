import mongoose from "mongoose";

const whatsappMsgSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    msg: { type: String, required: true },
    timestamps: { type: [Date], default: Date.now },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    context: { type: mongoose.Schema.Types.Mixed, required: true },
    whatsappMsgs: [whatsappMsgSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
