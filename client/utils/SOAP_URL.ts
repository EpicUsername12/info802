const SOAP_URL = process.env.SOAP_PUBLIC_URL as string;

if (!SOAP_URL) throw new Error("SOAP_PUBLIC_URL is not defined in the environment variables.");

export default SOAP_URL;
