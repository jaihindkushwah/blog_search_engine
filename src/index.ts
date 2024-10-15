import express from "express";
import { MongoClient } from "mongodb";
import Typesense from "typesense";
import { PORT, TYPESENSE_API_KEY } from "@/utils/variables";

const app = express();
app.use(express.json());

const port = PORT || 5000;

// MongoDB setup
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

const client = new MongoClient(uri);

// Typesense setup

const typesense = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || "localhost", // Typesense host
      port: parseInt(process.env.TYPESENSE_PORT || "8108"), // Typesense port
      protocol: process.env.TYPESENSE_PROTOCOL || "http", // Protocol (http/https)
    },
  ],
  apiKey: TYPESENSE_API_KEY || "JaihindKushwaha",
  connectionTimeoutSeconds: 2,
});

// MongoDB Change Stream Logic to update Typesense

async function monitorMongoDBChanges() {
  try {
    await client.connect();
    const collection = client.db("test").collection("contents");
    console.log("Connected to MongoDB and watching changes...");

    // Start watching the MongoDB collection for changes
    const changeStream = collection.watch();

    changeStream.on("change", async (next) => {
      if (next.operationType === "insert" || next.operationType === "update") {
        const changedDocument =
          next.fullDocument ||
          (await collection.findOne({ _id: next.documentKey._id }));

        // Format the document for Typesense

        const typesenseDocument = {
          id: changedDocument?._id.toString(), // Convert ObjectID to string
          title: changedDocument?.title,
          description: changedDocument?.description,
          titleId: changedDocument?.titleId,
          category: changedDocument?.category,
          createBy: changedDocument?.createBy,
          createdAt: changedDocument?.createdAt,
          updatedAt: changedDocument?.updatedAt,
        };

        // console.log("changedDocument", typesenseDocument);
        // console.log("changedDocument_id", typesenseDocument.id);

        // Upsert (add/update) the document in Typesense
        try {
          await typesense
            .collections("contents")
            .documents()
            .upsert(typesenseDocument);
          console.log("changedDocument_id", typesenseDocument.id);
        } catch (error: any) {
          console.error("Error sending document to Typesense:", error.message);
        }
      }

      if (next.operationType === "delete") {
        const documentId = next.documentKey._id.toString();

        // Delete the document from Typesense
        try {
          await typesense
            .collections("contents")
            .documents(documentId)
            .delete();
          console.log(`Document with ID ${documentId} deleted from Typesense.`);
        } catch (error) {
          console.error("Error deleting document from Typesense:", error);
        }
      }
    });
  } catch (error) {
    console.error("Error watching MongoDB collection:", error);
  }
}

monitorMongoDBChanges();

app.listen(port, () => {
  console.log("MongoDB watcher service running on port " + port);
});
