const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://kashif:kashif@cluster0.5qnat.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

export async function getURLs() {
  try {
    await client.connect();
    const collection = client.db("webHealth").collection("URLs");
    const result = await collection.find({}).toArray();
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

export async function createUrl(url: string) {
  try {
    await client.connect();
    const collection = client.db("webHealth").collection("URLs");
    const doc = await collection.find({ url: url }).toArray();
    if (doc.length === 0) {
      const result = await collection.insertOne({
        url: url,
      });
      console.log(result);
      return `${url} is added to database`;
    } else {
      return `URL ${url} is already in the database`;
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

export async function deleteUrl(url: string) {
  try {
    await client.connect();
    const collection = client.db("webHealth").collection("URLs");
    const result = await collection.deleteOne({ url: url });
    console.log(result);
    return `${url} is deleted from database`;
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

export async function updateUrl(oldUrl: string, newUrl: string) {
  try {
    await client.connect();
    const collection = client.db("webHealth").collection("URLs");
    const result = await collection.updateOne(
      { url: oldUrl },
      { $set: { url: newUrl } }
    );
    console.log(result);
    return `${oldUrl} is updated to ${newUrl} in database`;
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
