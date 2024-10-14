import { config } from "dotenv";
config();

const { env } = process;

export const {
  PORT,
  MONGODB_URI,
  TYPESENSE_HOST,
  TYPESENSE_PORT,
  TYPESENSE_PROTOCOL,
  TYPESENSE_API_KEY,
} = env;
