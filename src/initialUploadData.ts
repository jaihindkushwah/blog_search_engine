import typesense from "typesense";
import {
  TYPESENSE_API_KEY,
  TYPESENSE_HOST,
  TYPESENSE_PORT,
} from "@/utils/variables";
import { MongoClient } from "mongodb";

const client = new typesense.Client({
  nodes: [
    {
      host: TYPESENSE_HOST || "localhost",
      port: parseInt(TYPESENSE_PORT || "8108"),
      protocol: "http",
    },
  ],
  apiKey: TYPESENSE_API_KEY || "JaihindKushwaha",
});

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

const dbClient = new MongoClient(uri);

const resetTypesenseData = async () => {
  console.log("Populating index in Typesense");

  const schema: any = {
    name: "contents",
    fields: [
      { name: "title", type: "string", facet: true, infix: true, sort: true },
      { name: "description", type: "string", facet: true },
      { name: "titleId", type: "string", facet: true },
      { name: "category", type: "string", facet: true },
      { name: "createBy", type: "string" },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
    ],
    default_sorting_field: "title",
  };
  try {
    await client.collections("contents").delete();
    console.log("Deleting existing collection: contents");
  } catch (error) {
    console.log("Collection not found or already deleted");
  }

  //   console.log("Creating schema: ");
  //   console.log(JSON.stringify(schema, null, 2));

  try {
    await client.collections().create(schema);

    console.log("Creating connection ");

    await dbClient.connect();
    const collection = dbClient.db("test").collection("contents");

    const contents = await collection
      .find({}, { projection: { _id: 0, __v: 0, content: 0 } })
      .toArray();

    console.log("Adding records: ");
    const returnData: any = await client
      .collections("contents")
      .documents()
      .import(contents);

    console.log("Import Results successfully");

    const failedItems = returnData.filter(
      (item: any) => item.success === false
    );
    if (failedItems.length > 0) {
      throw new Error(
        `Error indexing items ${JSON.stringify(failedItems, null, 2)}`
      );
    }
    console.log("Done indexing.");
    await dbClient.close();
    return returnData;
  } catch (error) {
    await dbClient.close();
    console.log("Error during import:", error);
  }
};

resetTypesenseData();
