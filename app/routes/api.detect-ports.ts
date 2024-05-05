import { json } from "@remix-run/node";
import { autoDetect } from "@serialport/bindings-cpp";

export type DetectPortsResponse = { path: string; manufacturer: string }[];

export async function detectPorts() {
  const detected = (await autoDetect().list()).map((port: any) => ({
    path: port.path,
    manufacturer: port.manufacturer,
  }));

  return detected as DetectPortsResponse;
}

export async function loader() {
  return json(await detectPorts());
}
