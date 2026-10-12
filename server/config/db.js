import mongoose from "mongoose"
import env from "./env.js"
import logger from "../utils/logger.js"

const connectDB = async () => {
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"))
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"))

  const conn = await mongoose.connect(env.MONGO_URI)
  logger.info(`MongoDB connected: ${conn.connection.host}`)
}

export default connectDB
