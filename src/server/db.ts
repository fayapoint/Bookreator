import mongoose from "mongoose";
import { ENV } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

const globalWithCache = global as typeof global & {
  _mongooseConn?: typeof mongoose | null;
};

export async function connectToDatabase() {
  if (globalWithCache._mongooseConn) {
    return globalWithCache._mongooseConn;
  }

  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(ENV.MONGODB_URI, {
    dbName: "content_factory_ai",
  });

  globalWithCache._mongooseConn = conn;
  return conn;
}
