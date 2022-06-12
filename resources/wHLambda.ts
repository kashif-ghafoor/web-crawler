const axios = require("axios").default;
import { NAMESPACE, LATENCY_METRIC, AVAILABILITY_METRIC } from "./CONSTANTS";
import { AWS_CloudWatch } from "./cw_publish";
import { getURLs } from "./mongodb";
/**
 * main application
 * this module contains main logic to calculate
 * latency and availability metrics of given url
 * and send data to aws sdk to publish
 *
 */

exports.handler = async function (event: any) {
  const { publishMetric } = new AWS_CloudWatch();
  const URLs = await getURLs();
  const result = URLs.map(async (url: string) => {
    const availability = await getAvailability(url);
    publishMetric(url, NAMESPACE, AVAILABILITY_METRIC, availability);
    const latency = await getLatency(url);
    publishMetric(url, NAMESPACE, LATENCY_METRIC, latency);
    return { URL: url, availability: availability, latency: latency };
  });
  return await Promise.all(result);
};

async function getAvailability(webURL: string) {
  const response = await axios.get(webURL);
  return response.status === 200 ? 1.0 : 0.0;
}

async function getLatency(webURL: string) {
  const start = Date.now();
  const response = await axios.get(webURL);
  const end = Date.now();
  const time = end - start;
  return time; // returning time in milliseconds seconds
}
