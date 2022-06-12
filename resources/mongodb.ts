const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://kashif:kashif@cluster0.5qnat.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

export async function getURLs() {
  try {
    await client.connect();
    const collection = client.db("webHealth").collection("URLs");
    const result = await collection.find({}).toArray();
    return result.map((doc: { url: any }) => doc.url);
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}
