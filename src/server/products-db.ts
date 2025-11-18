import mongoose from "mongoose";
import { connectToDatabase } from "./db";

declare global {
  // eslint-disable-next-line no-var
  var _productsDb: mongoose.Connection | undefined;
}

const globalWithCache = global as typeof global & {
  _productsDb?: mongoose.Connection;
};

export async function connectToProductsDatabase() {
  if (globalWithCache._productsDb) {
    return globalWithCache._productsDb;
  }

  const baseConnection = await connectToDatabase();
  const productsDb = baseConnection.connection.useDb("fayapointProdutos", { useCache: true });
  globalWithCache._productsDb = productsDb;
  return productsDb;
}
